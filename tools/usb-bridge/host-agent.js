/**
 * USB Bridge — Host Agent (runs on THIS PC: acer)
 *
 * Watches USB_BRIDGE/host-inbox/ for response files from the sub-colony.
 * Writes task files to USB_BRIDGE/sub-inbox/ for the sub-colony to pick up.
 *
 * Usage:
 *   node host-agent.js <usb-drive-letter>
 *   node host-agent.js E
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const driveLetter = (process.argv[2] || "E").replace(/[:\\\/]/g, "");
const BASE = path.join(`${driveLetter}:`, "asolaria-bridge");
const SUB_INBOX = path.join(BASE, "sub-inbox");
const HOST_INBOX = path.join(BASE, "host-inbox");
const ARCHIVE = path.join(BASE, "archive");
const POLL_MS = 2000;

function ensureDirs() {
  for (const dir of [SUB_INBOX, HOST_INBOX, ARCHIVE]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function sendTask(taskObj) {
  const id = `task-${timestamp()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${id}.json`;
  const payload = { id, createdAt: new Date().toISOString(), ...taskObj };
  fs.writeFileSync(path.join(SUB_INBOX, filename), JSON.stringify(payload, null, 2));
  console.log(`[SENT] ${filename}`);
  return id;
}

function pollResponses() {
  try {
    const files = fs.readdirSync(HOST_INBOX).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const fullPath = path.join(HOST_INBOX, file);
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        console.log(`\n[RECEIVED] ${file}`);
        console.log(`  Task ID : ${content.taskId || content.id || "?"}`);
        console.log(`  Status  : ${content.status || "?"}`);
        if (content.result) {
          console.log(`  Result  : ${typeof content.result === "string" ? content.result : JSON.stringify(content.result, null, 2)}`);
        }
        if (content.error) {
          console.log(`  Error   : ${content.error}`);
        }
        // Archive
        fs.renameSync(fullPath, path.join(ARCHIVE, `host-${file}`));
      } catch (err) {
        console.error(`  [ERR] reading ${file}: ${err.message}`);
      }
    }
  } catch (_) {}
}

async function interactiveMode() {
  ensureDirs();
  console.log(`\n=== Asolaria USB Bridge — Host Agent ===`);
  console.log(`Drive    : ${driveLetter}:`);
  console.log(`Send to  : ${SUB_INBOX}`);
  console.log(`Receive  : ${HOST_INBOX}`);
  console.log(`Polling every ${POLL_MS}ms for responses.\n`);
  console.log(`Commands:`);
  console.log(`  send <type> <message>  — send a task to sub-colony`);
  console.log(`  ping                   — send a ping`);
  console.log(`  vault-read <key>       — request a vault read`);
  console.log(`  brain <prompt>         — send a brain/AI prompt`);
  console.log(`  quit                   — exit\n`);

  const poller = setInterval(pollResponses, POLL_MS);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.setPrompt("host> ");
  rl.prompt();

  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) { rl.prompt(); return; }

    if (trimmed === "quit" || trimmed === "exit") {
      clearInterval(poller);
      rl.close();
      process.exit(0);
    }

    if (trimmed === "ping") {
      sendTask({ type: "ping", message: "ping from host" });
    } else if (trimmed.startsWith("vault-read ")) {
      sendTask({ type: "vault-read", key: trimmed.slice(11).trim() });
    } else if (trimmed.startsWith("brain ")) {
      sendTask({ type: "brain", prompt: trimmed.slice(6).trim() });
    } else if (trimmed.startsWith("send ")) {
      const parts = trimmed.slice(5).trim();
      const spaceIdx = parts.indexOf(" ");
      if (spaceIdx > 0) {
        sendTask({ type: parts.slice(0, spaceIdx), message: parts.slice(spaceIdx + 1) });
      } else {
        sendTask({ type: parts, message: "" });
      }
    } else {
      sendTask({ type: "message", message: trimmed });
    }

    rl.prompt();
  });
}

interactiveMode();
