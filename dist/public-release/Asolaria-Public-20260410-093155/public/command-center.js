/* Asolaria Command Center — unified phone+desktop control surface */
const TOKEN_KEY = "asolaria.phone_mode.token";
const REMOTE_KEY = "asolaria.mobile.remote_base_url.v1";

function getBase() { try { return localStorage.getItem(REMOTE_KEY) || ""; } catch { return ""; } }
function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || new URLSearchParams(location.search).get("token") || ""; } catch { return ""; }
}
function api(path, options = {}) {
  const base = getBase() || location.origin;
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${base}${path}`, { ...options, headers }).then(r => {
    if (path.endsWith("/image") || path.includes("/capture/")) return r;
    return r.json();
  }).catch(() => null);
}
function apiImageUrl(path) {
  const base = getBase() || location.origin;
  const token = getToken();
  return `${base}${path}${token ? `?token=${encodeURIComponent(token)}&t=${Date.now()}` : `?t=${Date.now()}`}`;
}
function log(msg) {
  const el = document.getElementById("eventLog");
  if (!el) return;
  const time = new Date().toLocaleTimeString();
  el.textContent = `[${time}] ${msg}\n${el.textContent}`.slice(0, 4000);
}

/* ===== TABS ===== */
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    const panel = document.getElementById(`panel-${tab.dataset.tab}`);
    if (panel) panel.classList.add("active");
  });
});

/* ===== DESKTOP MIRROR ===== */
const desktopImage = document.getElementById("desktopImage");
const desktopStatus = document.getElementById("desktopStatus");
let autoDesktop = false;
let autoDesktopTimer = null;

async function refreshDesktop() {
  desktopStatus.textContent = "Capturing...";
  const result = await api("/api/mobile/screen/capture", { method: "POST", body: JSON.stringify({}) });
  if (result && result.ok) {
    desktopImage.src = apiImageUrl("/api/mobile/screen/image");
    desktopStatus.textContent = `OK ${new Date().toLocaleTimeString()}`;
    log("Desktop capture refreshed");
  } else {
    desktopStatus.textContent = "Capture failed";
    log("Desktop capture failed");
  }
}
document.getElementById("refreshDesktopBtn").addEventListener("click", refreshDesktop);
document.getElementById("autoDesktopBtn").addEventListener("click", () => {
  autoDesktop = !autoDesktop;
  document.getElementById("autoDesktopBtn").textContent = `Auto: ${autoDesktop ? "ON" : "OFF"}`;
  if (autoDesktop) {
    refreshDesktop();
    autoDesktopTimer = setInterval(refreshDesktop, 5000);
  } else {
    clearInterval(autoDesktopTimer);
  }
});

/* Desktop click-to-control */
let desktopControlArmed = false;
document.getElementById("armDesktopBtn").addEventListener("click", async () => {
  const result = await api("/api/mobile/control/arm", { method: "POST", body: JSON.stringify({ by: "command-center" }) });
  if (result && result.ok) {
    desktopControlArmed = true;
    document.getElementById("armDesktopBtn").textContent = "ARMED ✓";
    log("Desktop control armed");
    setTimeout(() => { desktopControlArmed = false; document.getElementById("armDesktopBtn").textContent = "Arm Control"; }, 90000);
  }
});
desktopImage.addEventListener("click", async (e) => {
  if (!desktopControlArmed) return;
  const rect = desktopImage.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  await api("/api/mobile/control/click", { method: "POST", body: JSON.stringify({ x, y }) });
  log(`Desktop click at ${(x*100).toFixed(1)}%, ${(y*100).toFixed(1)}%`);
  setTimeout(refreshDesktop, 800);
});
document.getElementById("deskScrollUp").addEventListener("click", async () => {
  await api("/api/mobile/control/scroll", { method: "POST", body: JSON.stringify({ direction: "up", amount: 3 }) });
  log("Desktop scroll up"); setTimeout(refreshDesktop, 500);
});
document.getElementById("deskScrollDown").addEventListener("click", async () => {
  await api("/api/mobile/control/scroll", { method: "POST", body: JSON.stringify({ direction: "down", amount: 3 }) });
  log("Desktop scroll down"); setTimeout(refreshDesktop, 500);
});
document.getElementById("deskTypeSend").addEventListener("click", async () => {
  const text = document.getElementById("deskTypeInput").value.trim();
  if (!text) return;
  await api("/api/mobile/control/type", { method: "POST", body: JSON.stringify({ text }) });
  document.getElementById("deskTypeInput").value = "";
  log(`Typed on desktop: ${text.slice(0, 40)}`);
});

/* ===== PHONE MIRROR ===== */
const phoneImage = document.getElementById("phoneImage");
const phoneStatus = document.getElementById("phoneStatus");
let autoPhone = false;
let autoPhoneTimer = null;

async function refreshPhone() {
  phoneStatus.textContent = "Capturing...";
  const result = await api("/api/phone/mirror/capture", { method: "POST", body: JSON.stringify({}) });
  if (result && result.ok) {
    phoneImage.src = apiImageUrl("/api/phone/mirror/image");
    phoneStatus.textContent = `OK ${new Date().toLocaleTimeString()}`;
    log("Phone capture refreshed");
  } else {
    phoneStatus.textContent = "Capture failed";
    log("Phone capture failed");
  }
}
document.getElementById("refreshPhoneBtn").addEventListener("click", refreshPhone);
document.getElementById("autoPhoneBtn").addEventListener("click", () => {
  autoPhone = !autoPhone;
  document.getElementById("autoPhoneBtn").textContent = `Auto: ${autoPhone ? "ON" : "OFF"}`;
  if (autoPhone) {
    refreshPhone();
    autoPhoneTimer = setInterval(refreshPhone, 5000);
  } else {
    clearInterval(autoPhoneTimer);
  }
});

/* ===== AGENT LANES ===== */
const LANES = ["vector", "rook", "forge"];
async function refreshLanes() {
  const colonyEnvelope = await api("/api/worker-runtime/colony");
  const colony = colonyEnvelope && colonyEnvelope.agentColony
    ? { ok: colonyEnvelope.ok !== false, ...colonyEnvelope.agentColony }
    : colonyEnvelope;
  if (!colony || !colony.ok) {
    document.getElementById("colonyBadge").textContent = "Colony: offline";
    LANES.forEach(id => {
      document.getElementById(`${id}State`).textContent = "offline";
      document.getElementById(`${id}State`).className = "lane-state offline";
      document.getElementById(`lane${id[0].toUpperCase()}`).className = "lane-dot offline";
    });
    return;
  }
  const agents = Array.isArray(colony.agents) ? colony.agents : [];
  const counts = colony.counts || {};
  document.getElementById("colonyBadge").textContent = `Colony: ${counts.active || 0}/${counts.total || 0} active`;

  LANES.forEach(id => {
    const agent = agents.find(a => a.id === id) || {};
    const state = agent.state || "offline";
    const stateEl = document.getElementById(`${id}State`);
    const dotEl = document.getElementById(`lane${id[0].toUpperCase()}`);
    stateEl.textContent = state;
    stateEl.className = `lane-state ${state}`;
    dotEl.className = `lane-dot ${state === "active" ? "active" : state === "idle" ? "" : "offline"}`;

    const taskEl = document.getElementById(`${id}Task`);
    const lastExec = agent.lastExecution || {};
    taskEl.textContent = lastExec.taskTitle || agent.role || "No active task";

    const outputEl = document.getElementById(`${id}Output`);
    const lastOutput = String(agent.lastOutputText || lastExec.lastOutputText || "").trim();
    if (lastOutput) outputEl.textContent = lastOutput.slice(0, 2000);
  });
}

LANES.forEach(id => {
  document.getElementById(`${id}Send`).addEventListener("click", async () => {
    const input = document.getElementById(`${id}Input`);
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    log(`Sent to ${id}: ${text.slice(0, 60)}`);
    await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: `[${id} lane] ${text}`, source: "command-center", targetLane: id })
    });
  });
  document.getElementById(`${id}Input`).addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById(`${id}Send`).click();
  });
});

/* ===== VIRTUAL SCREENS ===== */
document.getElementById("vscreenCreateBtn").addEventListener("click", async () => {
  document.getElementById("vscreenStatus").textContent = "Creating displays...";
  const result = await api("/api/phone/virtual-display/create", {
    method: "POST", body: JSON.stringify({ count: 3, width: 480, height: 960, dpi: 160 })
  });
  if (result && result.ok) {
    document.getElementById("vscreenStatus").textContent = `${result.count || 3} displays active`;
    log(`Created ${result.count || 3} virtual displays`);
  } else {
    document.getElementById("vscreenStatus").textContent = "Create failed — trying ADB fallback";
    log("Virtual display creation failed");
  }
});
document.getElementById("vscreenDestroyBtn").addEventListener("click", async () => {
  await api("/api/phone/virtual-display/destroy", { method: "POST" });
  document.getElementById("vscreenStatus").textContent = "Displays destroyed";
  [1, 2, 3].forEach(i => { document.getElementById(`vscreen${i}Image`).src = ""; });
  log("Virtual displays destroyed");
});

async function refreshVScreen(index) {
  const statusEl = document.getElementById(`vscreen${index}Status`);
  statusEl.textContent = "Capturing...";
  const result = await api("/api/phone/virtual-display/capture", {
    method: "POST",
    body: JSON.stringify({ displayIndex: index })
  });
  if (result && result.ok) {
    document.getElementById(`vscreen${index}Image`).src = apiImageUrl(`/api/phone/virtual-display/image/${index}`);
    statusEl.textContent = `OK ${new Date().toLocaleTimeString()}`;
  } else {
    statusEl.textContent = "Failed";
  }
}
document.getElementById("vscreenRefreshBtn").addEventListener("click", () => { [1, 2, 3].forEach(refreshVScreen); });
[1, 2, 3].forEach(i => {
  document.getElementById(`vscreen${i}Refresh`).addEventListener("click", () => refreshVScreen(i));
});

/* ===== CHAT ===== */
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatHistory = [];

function renderChat() {
  chatMessages.innerHTML = chatHistory.map(turn => {
    const cls = turn.role === "user" ? "user" : "assistant";
    return `<div class="chat-turn ${cls}">${turn.text}</div>`;
  }).join("");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
document.getElementById("chatSend").addEventListener("click", async () => {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  chatHistory.push({ role: "user", text });
  renderChat();
  log(`Chat sent: ${text.slice(0, 60)}`);
  const result = await api("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message: text, source: "command-center" })
  });
  const reply = result?.reply || result?.text || result?.message || "No response.";
  chatHistory.push({ role: "assistant", text: typeof reply === "string" ? reply : JSON.stringify(reply) });
  renderChat();
});
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); document.getElementById("chatSend").click(); }
});

/* ===== ADMIN ===== */
async function refreshAdmin() {
  const colonyEnvelope = await api("/api/worker-runtime/colony");
  const colony = colonyEnvelope && colonyEnvelope.agentColony
    ? { ok: colonyEnvelope.ok !== false, ...colonyEnvelope.agentColony }
    : colonyEnvelope;
  const colonyEl = document.getElementById("colonyStatus");
  if (colony && colony.ok) {
    const agents = (colony.agents || []).map(a => `${a.name || a.id}: ${a.state} (PID ${a.pid || "—"})`).join("\n");
    colonyEl.textContent = `Updated: ${colony.updatedAt || "?"}\nRelay: ${colony.relay?.running ? "running" : "offline"}\nTunnel: ${colony.tunnel?.running ? "running" : "offline"}\n\nAgents:\n${agents}`;
  } else {
    colonyEl.textContent = "Failed to load colony status";
  }

  const tasks = await api("/api/task-ledger/state");
  const taskEl = document.getElementById("taskSummary");
  if (tasks && tasks.ok) {
    const s = tasks.ledger?.summary || {};
    taskEl.textContent = `Total: ${s.totalTasks || 0}\nOpen: ${s.openTasks || 0}\nActive: ${s.activeTasks || 0}\nDone: ${s.statusCounts?.done || 0}\nBlocked: ${s.statusCounts?.blocked || 0}\nPlanned: ${s.statusCounts?.planned || 0}`;
  }
}

/* Power controls */
document.getElementById("pwrShutdown").addEventListener("click", async () => {
  if (!confirm("Shutdown the PC?")) return;
  await api("/api/power/shutdown", { method: "POST", body: JSON.stringify({ delaySeconds: 30 }) });
  log("Shutdown command sent");
});
document.getElementById("pwrRestart").addEventListener("click", async () => {
  if (!confirm("Restart the PC?")) return;
  await api("/api/power/restart", { method: "POST", body: JSON.stringify({ delaySeconds: 30 }) });
  log("Restart command sent");
});
document.getElementById("pwrWol").addEventListener("click", async () => {
  await api("/api/power/wol/send", { method: "POST", body: JSON.stringify({}) });
  log("Wake-on-LAN sent");
});
document.getElementById("pwrAbort").addEventListener("click", async () => {
  await api("/api/power/abort", { method: "POST", body: JSON.stringify({}) });
  log("Shutdown aborted");
});

/* ===== INIT ===== */
refreshLanes();
refreshAdmin();
setInterval(refreshLanes, 15000);
setInterval(refreshAdmin, 30000);
log("Command Center initialized");
