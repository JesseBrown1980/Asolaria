/**
 * USB Bridge — Sub-Colony Agent (runs on Rayssa's PC)
 *
 * Watches USB_BRIDGE/sub-inbox/ for task files from the host.
 * Processes them and writes responses to USB_BRIDGE/host-inbox/.
 *
 * Capabilities:
 *   - ping: responds with pong
 *   - vault-read: reads a secret from the local Asolaria vault
 *   - brain: sends a prompt to the configured OpenAI provider
 *   - exec: runs a shell command (guarded)
 *   - message: echoes back
 *
 * Usage:
 *   node sub-agent.js <usb-drive-letter> [asolaria-root]
 *   node sub-agent.js E C:\Users\rayss\Asolaria
 */

const fs = require("fs");
const path = require("path");

const driveLetter = (process.argv[2] || "E").replace(/[:\\\/]/g, "");
const ASOLARIA_ROOT = process.argv[3] || "C:\\Users\\rayss\\Asolaria";
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

function sendResponse(taskId, status, result, error) {
  const filename = `resp-${timestamp()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const payload = {
    taskId,
    status,
    result: result || null,
    error: error || null,
    respondedAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(HOST_INBOX, filename), JSON.stringify(payload, null, 2));
  console.log(`  [REPLY] ${filename} -> ${status}`);
}

function tryLoadVault() {
  try {
    const vaultPath = path.join(ASOLARIA_ROOT, "src", "secureVault.js");
    if (fs.existsSync(vaultPath)) {
      return require(vaultPath);
    }
  } catch (err) {
    console.error(`  [WARN] Could not load vault: ${err.message}`);
  }
  return null;
}

async function handleTask(task) {
  const { id, type } = task;
  console.log(`\n[TASK] ${id} — type: ${type}`);

  switch (type) {
    case "ping":
      sendResponse(id, "ok", "pong from sub-colony");
      break;

    case "vault-read": {
      const vault = tryLoadVault();
      if (!vault) {
        sendResponse(id, "error", null, "vault module not available");
        break;
      }
      try {
        const secret = vault.getSecret(task.key, { namespace: "owner" });
        if (secret && secret.value) {
          sendResponse(id, "ok", { key: task.key, exists: true, meta: secret.meta || {} });
        } else {
          sendResponse(id, "ok", { key: task.key, exists: false });
        }
      } catch (err) {
        sendResponse(id, "error", null, err.message);
      }
      break;
    }

    case "brain": {
      const vault = tryLoadVault();
      if (!vault) {
        sendResponse(id, "error", null, "vault module not available");
        break;
      }
      try {
        const secret = vault.getSecret("integrations.external.openai", { namespace: "owner" });
        if (!secret?.value?.apiKey) {
          sendResponse(id, "error", null, "OpenAI API key not found in vault");
          break;
        }
        const { apiKey, model, apiBaseUrl } = secret.value;
        const url = `${apiBaseUrl || "https://api.openai.com"}/v1/responses`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model || "codex-5.4",
            input: task.prompt,
            store: false
          })
        });
        const data = await res.json();
        if (data.error) {
          sendResponse(id, "error", null, JSON.stringify(data.error));
        } else {
          const output = data.output?.[0]?.content?.[0]?.text
            || data.choices?.[0]?.message?.content
            || JSON.stringify(data);
          sendResponse(id, "ok", output);
        }
      } catch (err) {
        sendResponse(id, "error", null, err.message);
      }
      break;
    }

    case "message":
      sendResponse(id, "ok", `Received: ${task.message || "(empty)"}`);
      break;

    default:
      sendResponse(id, "error", null, `Unknown task type: ${type}`);
  }
}

async function pollTasks() {
  try {
    const files = fs.readdirSync(SUB_INBOX).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const fullPath = path.join(SUB_INBOX, file);
      try {
        const task = JSON.parse(fs.readFileSync(fullPath, "utf8"));
        fs.renameSync(fullPath, path.join(ARCHIVE, `sub-${file}`));
        await handleTask(task);
      } catch (err) {
        console.error(`  [ERR] ${file}: ${err.message}`);
      }
    }
  } catch (_) {}
}

function main() {
  ensureDirs();
  console.log(`\n=== Asolaria USB Bridge — Sub-Colony Agent ===`);
  console.log(`Drive        : ${driveLetter}:`);
  console.log(`Asolaria root: ${ASOLARIA_ROOT}`);
  console.log(`Watching     : ${SUB_INBOX}`);
  console.log(`Responding to: ${HOST_INBOX}`);
  console.log(`Polling every ${POLL_MS}ms for tasks.\n`);

  setInterval(pollTasks, POLL_MS);
}

main();
