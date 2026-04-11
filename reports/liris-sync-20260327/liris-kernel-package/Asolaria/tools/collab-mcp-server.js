const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PORT = 4795;
const HOST = "0.0.0.0";
const TOKEN = fs.readFileSync(path.join(__dirname, "..", "logs", "augment-mcp-bridge-token.txt"), "utf8").trim();
const WORKSPACE = path.resolve(path.join(__dirname, ".."));
const LOG_FILE = path.join(WORKSPACE, "logs", "collab-mcp-server.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

function authCheck(req) {
  const auth = req.headers["authorization"] || "";
  const urlToken = new URL(req.url, `http://${req.headers.host}`).searchParams.get("token");
  if (auth === `Bearer ${TOKEN}`) return true;
  if (urlToken === TOKEN) return true;
  return false;
}

// MCP Streamable HTTP handler
let sessionInitialized = false;

function handleMcpRequest(body) {
  const { method, id, params } = body;

  if (method === "initialize") {
    sessionInitialized = true;
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "asolaria-collab-bridge", version: "1.0.0" }
      }
    };
  }

  if (method === "notifications/initialized") {
    return null; // notification, no response
  }

  if (method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "run-command",
            description: "Execute a shell command on Rayssa's machine (C:\\Users\\rayss). Returns stdout/stderr. Timeout 60s.",
            inputSchema: {
              type: "object",
              properties: {
                command: { type: "string", description: "The shell command to run" },
                cwd: { type: "string", description: "Working directory (default: Asolaria root)" }
              },
              required: ["command"]
            }
          },
          {
            name: "write-file",
            description: "Write content to a file on Rayssa's machine.",
            inputSchema: {
              type: "object",
              properties: {
                path: { type: "string", description: "Absolute or workspace-relative file path" },
                content: { type: "string", description: "File content to write" }
              },
              required: ["path", "content"]
            }
          },
          {
            name: "read-file",
            description: "Read a file from Rayssa's machine.",
            inputSchema: {
              type: "object",
              properties: {
                path: { type: "string", description: "Absolute or workspace-relative file path" }
              },
              required: ["path"]
            }
          },
          {
            name: "list-files",
            description: "List files in a directory on Rayssa's machine.",
            inputSchema: {
              type: "object",
              properties: {
                path: { type: "string", description: "Directory path (default: Asolaria root)" },
                pattern: { type: "string", description: "Optional glob filter" }
              }
            }
          },
          {
            name: "search-code",
            description: "Search code using ripgrep on Rayssa's machine.",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "Search pattern (regex)" },
                path: { type: "string", description: "Directory to search (default: Asolaria root)" },
                glob: { type: "string", description: "File glob filter e.g. '*.js'" }
              },
              required: ["query"]
            }
          },
          {
            name: "collab-message",
            description: "Send a coordination message to Rayssa's Claude Code via the collab board.",
            inputSchema: {
              type: "object",
              properties: {
                message: { type: "string", description: "Message text" },
                task: { type: "string", description: "Optional task assignment for Rayssa's Claude" }
              },
              required: ["message"]
            }
          }
        ]
      }
    };
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};
    log(`Tool call: ${toolName} ${JSON.stringify(args).slice(0, 200)}`);

    try {
      if (toolName === "run-command") {
        const cwd = args.cwd || WORKSPACE;
        const result = execSync(args.command, {
          cwd,
          timeout: 60000,
          maxBuffer: 1024 * 1024,
          encoding: "utf8",
          shell: true
        });
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: result || "(no output)" }] } };
      }

      if (toolName === "write-file") {
        const filePath = path.isAbsolute(args.path) ? args.path : path.join(WORKSPACE, args.path);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, args.content, "utf8");
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Written: ${filePath} (${args.content.length} chars)` }] } };
      }

      if (toolName === "read-file") {
        const filePath = path.isAbsolute(args.path) ? args.path : path.join(WORKSPACE, args.path);
        const content = fs.readFileSync(filePath, "utf8");
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: content }] } };
      }

      if (toolName === "list-files") {
        const dirPath = args.path || WORKSPACE;
        const resolved = path.isAbsolute(dirPath) ? dirPath : path.join(WORKSPACE, dirPath);
        let cmd = `ls "${resolved}"`;
        if (args.pattern) cmd = `find "${resolved}" -maxdepth 3 -name "${args.pattern}" 2>/dev/null`;
        const result = execSync(cmd, { encoding: "utf8", timeout: 10000, shell: true });
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: result || "(empty)" }] } };
      }

      if (toolName === "search-code") {
        const searchPath = args.path || WORKSPACE;
        const resolved = path.isAbsolute(searchPath) ? searchPath : path.join(WORKSPACE, searchPath);
        let cmd = `rg --no-heading -n "${args.query}" "${resolved}"`;
        if (args.glob) cmd += ` --glob "${args.glob}"`;
        cmd += " | head -100";
        const result = execSync(cmd, { encoding: "utf8", timeout: 15000, shell: true });
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: result || "(no matches)" }] } };
      }

      if (toolName === "collab-message") {
        const boardPath = path.join(WORKSPACE, "logs", "collab-board.json");
        let board = {};
        try { board = JSON.parse(fs.readFileSync(boardPath, "utf8")); } catch (_) { board = { messages: [], tasks: [] }; }
        if (!board.messages) board.messages = [];
        if (!board.tasks) board.tasks = [];
        board.messages.push({
          from: "jesse_claude",
          time: new Date().toISOString(),
          msg: args.message
        });
        if (args.task) {
          board.tasks.push({
            from: "jesse_claude",
            time: new Date().toISOString(),
            task: args.task,
            status: "pending"
          });
        }
        board.updated = new Date().toISOString();
        fs.writeFileSync(boardPath, JSON.stringify(board, null, 2), "utf8");
        return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Message posted. ${args.task ? "Task created." : ""}` }] } };
      }

      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown tool: ${toolName}` } };
    } catch (err) {
      return { jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `Error: ${err.message}\n${err.stderr || ""}` }], isError: true } };
    }
  }

  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } };
}

const server = http.createServer((req, res) => {
  if (!authCheck(req)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }

  if (req.method === "POST" && req.url.startsWith("/mcp")) {
    const accept = req.headers["accept"] || "";
    if (!accept.includes("application/json") || !accept.includes("text/event-stream")) {
      res.writeHead(406, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Not Acceptable: Client must accept both application/json and text/event-stream" }, id: null }));
      return;
    }

    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        const response = handleMcpRequest(parsed);
        if (response === null) {
          res.writeHead(204);
          res.end();
          return;
        }
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        });
        res.write(`event: message\ndata: ${JSON.stringify(response)}\n\n`);
        res.end();
      } catch (err) {
        log(`Parse error: ${err.message}`);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }));
      }
    });
    return;
  }

  // Health check
  if (req.method === "GET" && req.url.startsWith("/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, host: HOST, port: PORT, workspace: WORKSPACE }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, HOST, () => {
  log(`Collab MCP server listening on http://${HOST}:${PORT}/mcp`);
  log(`Workspace: ${WORKSPACE}`);
  log(`Tools: run-command, write-file, read-file, list-files, search-code, collab-message`);
});
