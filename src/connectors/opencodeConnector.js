const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { resolveToolPaths } = require("./systemPaths");

function clipText(value, maxChars = 500) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
}

function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch (_error) {
    return null;
  }
}

function collectTextFragments(value, out = []) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      out.push(trimmed);
    }
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextFragments(item, out);
    }
    return out;
  }
  if (!value || typeof value !== "object") {
    return out;
  }

  const keys = [
    "output_text",
    "reply",
    "text",
    "message",
    "content",
    "summary"
  ];
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      collectTextFragments(value[key], out);
    }
  }
  if (value.item && typeof value.item === "object") {
    collectTextFragments(value.item, out);
  }
  if (value.response && typeof value.response === "object") {
    collectTextFragments(value.response, out);
  }
  return out;
}

function extractReplyFromEvents(events = []) {
  const fragments = [];
  for (const event of Array.isArray(events) ? events : []) {
    collectTextFragments(event, fragments);
  }
  const unique = [];
  const seen = new Set();
  for (const fragment of fragments) {
    const key = fragment.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(key);
  }
  if (!unique.length) {
    return "";
  }
  unique.sort((left, right) => right.length - left.length);
  return unique[0];
}

function normalizeFiles(rawFiles) {
  if (!Array.isArray(rawFiles)) {
    return [];
  }
  return rawFiles
    .map((filePath) => String(filePath || "").trim())
    .filter((filePath) => filePath && fs.existsSync(filePath))
    .slice(0, 12);
}

function normalizeOptions(input, timeoutMs) {
  if (typeof input === "string") {
    return {
      prompt: input,
      timeoutMs: Number(timeoutMs || 180000),
      model: "",
      agent: "",
      variant: "",
      files: [],
      dir: process.cwd()
    };
  }

  const source = input || {};
  return {
    prompt: String(source.prompt || source.message || "").trim(),
    timeoutMs: Number(source.timeoutMs || timeoutMs || 180000),
    model: String(source.model || "").trim(),
    agent: String(source.agent || "").trim(),
    variant: String(source.variant || "").trim(),
    files: normalizeFiles(source.files || source.attachments),
    dir: String(source.dir || source.cwd || process.cwd()).trim() || process.cwd()
  };
}

function resolveOpenCodeExecutable(options = {}) {
  const explicit = String(options.executable || "").trim();
  if (explicit) {
    return explicit;
  }

  const envOverride = String(process.env.ASOLARIA_OPENCODE_PATH || "").trim();
  if (envOverride) {
    return envOverride;
  }

  const toolPaths = resolveToolPaths();
  return String(toolPaths.opencodePath || "opencode").trim();
}

function isShelllessOpenCodeExecutable(executable) {
  const rawExecutable = String(executable || "").trim();
  const lowered = rawExecutable.toLowerCase();
  if (!rawExecutable) {
    return false;
  }
  if (lowered.endsWith(".ps1") || lowered.endsWith(".cmd") || lowered.endsWith(".bat")) {
    return false;
  }
  return true;
}

function resolveOpenCodeLaunch(executable) {
  const rawExecutable = String(executable || "").trim();
  if (!rawExecutable) {
    return {
      command: "opencode",
      prefixArgs: [],
      viaCmdWrapper: false
    };
  }

  if (process.platform !== "win32") {
    return {
      command: rawExecutable,
      prefixArgs: [],
      viaCmdWrapper: false
    };
  }

  if (!isShelllessOpenCodeExecutable(rawExecutable)) {
    throw new Error("OpenCode direct dispatch requires a shellless executable path; ps1/cmd/bat wrappers are blocked.");
  }

  return {
    command: rawExecutable,
    prefixArgs: [],
    viaCmdWrapper: false
  };
}

function runOpenCode(input, timeoutMs = 180000) {
  const options = normalizeOptions(input, timeoutMs);
  if (!options.prompt) {
    return Promise.reject(new Error("Prompt is required for OpenCode execution."));
  }
  if (input && typeof input === "object" && input["dangerously" + "SkipPermissions"]) {
    return Promise.reject(new Error("OpenCode permission bypass is disabled by Asolaria policy."));
  }

  return new Promise((resolve, reject) => {
    const executable = resolveOpenCodeExecutable(options);
    if (!isShelllessOpenCodeExecutable(executable)) {
      reject(new Error("OpenCode direct dispatch is blocked because the resolved path is not shellless."));
      return;
    }
    let launch;
    try {
      launch = resolveOpenCodeLaunch(executable);
    } catch (error) {
      reject(error);
      return;
    }
    const cwd = fs.existsSync(options.dir) ? options.dir : process.cwd();
    const args = ["run", "--format", "json", "--dir", cwd];

    if (options.model) {
      args.push("-m", options.model);
    }
    if (options.agent) {
      args.push("--agent", options.agent);
    }
    if (options.variant) {
      args.push("--variant", options.variant);
    }
    for (const filePath of options.files) {
      args.push("-f", filePath);
    }
    args.push(options.prompt);

    const spawnArgs = [...launch.prefixArgs, ...args];
    const child = spawn(launch.command, spawnArgs, {
      windowsHide: true,
      cwd,
      env: process.env
    });

    let stdout = "";
    let stderr = "";
    let outBuffer = "";
    const events = [];
    let settled = false;

    const timeoutHandle = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      child.kill();
      reject(new Error("OpenCode timed out."));
    }, Math.max(15000, Number(options.timeoutMs || 180000)));

    function settleReject(error) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      reject(error);
    }

    function settleResolve(payload) {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      resolve(payload);
    }

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      outBuffer += text;
      let newlineIndex = outBuffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = outBuffer.slice(0, newlineIndex).trim();
        outBuffer = outBuffer.slice(newlineIndex + 1);
        if (line) {
          const parsed = parseJsonLine(line);
          if (parsed) {
            events.push(parsed);
          }
        }
        newlineIndex = outBuffer.indexOf("\n");
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      settleReject(new Error(`Failed to start OpenCode: ${error.message}`));
    });

    child.on("close", (code) => {
      const trailing = outBuffer.trim();
      if (trailing) {
        const parsed = parseJsonLine(trailing);
        if (parsed) {
          events.push(parsed);
        }
      }

      const cleanStdout = String(stdout || "").trim();
      const cleanStderr = String(stderr || "").trim();
      const reply = extractReplyFromEvents(events) || cleanStdout;
      const eventModel = events
        .map((event) => String(event?.model || event?.response?.model || "").trim())
        .find(Boolean) || "";
      const summary = clipText(cleanStderr || cleanStdout || `exit code ${code}`, 450);

      if (Number(code || 0) !== 0) {
        return settleReject(new Error(`OpenCode exited with code ${code}. ${summary}`.trim()));
      }

      if (!reply) {
        return settleReject(new Error("OpenCode returned no reply text."));
      }

      settleResolve({
        provider: "opencode",
        model: eventModel || options.model || "",
        agent: options.agent || "",
        variant: options.variant || "",
        reply,
        raw: {
          executable,
          cwd,
          args,
          exitCode: Number(code || 0),
          stdout: cleanStdout,
          stderr: cleanStderr,
          events
        }
      });
    });
  });
}

function manifest() {
  return {
    id: "opencode",
    title: "OpenCode",
    description: "Local OpenCode CLI worker lane via non-interactive `opencode run`.",
    capabilities: ["run_prompt", "local_cli_execution", "bounded_json_output"],
    readScopes: ["local_workspace", "attached_files"],
    writeScopes: ["provider_quota"],
    sideEffects: ["executes local OpenCode CLI subprocess", "consumes configured provider quota"],
    failureModes: ["cli_not_found", "auth_missing", "timeout", "process_crash", "no_reply"],
    emittedEvents: ["opencode.run", "opencode.completed", "opencode.error"]
  };
}

module.exports = {
  runOpenCode,
  isShelllessOpenCodeExecutable,
  manifest
};
