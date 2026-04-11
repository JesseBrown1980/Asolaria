#!/usr/bin/env node
/**
 * Liris Self-Reflection Loop
 *
 * Every 16 minutes, generates a self-reflection question, evaluates system state,
 * appends findings to the local index, and looks for patterns.
 *
 * Can be run as:
 *   - Cron: node liris-self-reflect.js --once
 *   - Daemon: node liris-self-reflect.js (runs forever, 16min interval)
 *   - Control: node liris-self-reflect.js --status | --stop
 *
 * Default: ON (daemon mode)
 * Operator can toggle: create/remove LIRIS_REFLECT_PAUSED file to pause/resume
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, exec } = require('child_process');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const INDEX_DIR = path.join(DATA, 'liris-index');
const MISTAKES_DIR = path.join(DATA, 'liris-mistakes');
const IDEAS_DIR = path.join(DATA, 'liris-ideas');
const TASKS_DIR = path.join(DATA, 'liris-tasks');
const LOG_FILE = path.join(ROOT, 'logs', 'liris-self-reflect.log');
const PID_FILE = path.join(DATA, 'liris-reflect.pid');
const PAUSE_FILE = path.join(DATA, 'LIRIS_REFLECT_PAUSED');
const STATE_FILE = path.join(INDEX_DIR, 'reflect-state.json');
const REFLECTIONS_FILE = path.join(INDEX_DIR, 'reflections.ndjson');
const PATTERNS_FILE = path.join(INDEX_DIR, 'detected-patterns.json');
const LISTENER_PORT = 4810;
const INTERVAL_MS = 16 * 60 * 1000; // 16 minutes

// Ensure dirs
[INDEX_DIR, MISTAKES_DIR, IDEAS_DIR, TASKS_DIR, path.join(ROOT, 'logs')].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// --- Logging ---
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

// --- State ---
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { totalReflections: 0, lastReflection: null, patternsFound: 0, started: new Date().toISOString() }; }
}

function saveState(state) {
  const tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

// --- Self-Reflection Questions ---
const QUESTION_BANK = [
  // System health
  "What is the current connection status to the sovereign? Can I reach the bridge?",
  "Are there any new files or changes in the Asolaria project since last check?",
  "What tasks are currently blocked and can any be unblocked?",
  "Is the MQTT bridge running? What's the last log entry?",
  // Self-improvement
  "What mistakes have I made recently? Are there new patterns to add?",
  "What tools exist that I haven't indexed yet?",
  "Can any manual processes be automated with a new tool?",
  "What information would reduce token usage in future sessions?",
  // Colony awareness
  "Has anyone sent messages through the bridge since last check?",
  "Are there new skills in the skills directory?",
  "What's the disk usage of the data directory?",
  "Are there any log files growing too large?",
  // Proactive
  "What can I pre-compute or pre-index to help Rayssa's next request?",
  "Are there any security concerns in the current config?",
  "What's the git status of the Asolaria repo?",
  "Can I generate a compact boot snapshot for the next session?",
  // Pattern detection
  "Are there recurring errors in any log files?",
  "What are the most common operations I perform? Can they be optimized?",
  "Are there files that changed recently that I should be aware of?",
  "What would Helm or Gaia need from me right now?"
];

function pickQuestion(state) {
  const idx = (state.totalReflections || 0) % QUESTION_BANK.length;
  return QUESTION_BANK[idx];
}

// --- Probes ---
function probeBridge() {
  return new Promise((resolve) => {
    const req = http.get('http://192.168.1.3:8788/', { timeout: 5000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ reachable: true, status: res.statusCode, body: d.slice(0, 200) }));
    });
    req.on('error', (e) => resolve({ reachable: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ reachable: false, error: 'timeout' }); });
  });
}

function probeLocal() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:4781/api/health', { timeout: 3000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ running: true, status: res.statusCode }));
    });
    req.on('error', () => resolve({ running: false }));
    req.on('timeout', () => { req.destroy(); resolve({ running: false }); });
  });
}

function checkDiskUsage() {
  try {
    const files = fs.readdirSync(DATA);
    let totalBytes = 0;
    for (const f of files) {
      try {
        const stat = fs.statSync(path.join(DATA, f));
        if (stat.isFile()) totalBytes += stat.size;
      } catch {}
    }
    return { files: files.length, totalKB: Math.round(totalBytes / 1024) };
  } catch { return { error: 'cannot read data dir' }; }
}

function checkNewSkills() {
  try {
    const skills = fs.readdirSync(path.join(ROOT, 'skills')).filter(f => !f.startsWith('.') && f !== 'README.md');
    return { count: skills.length };
  } catch { return { error: 'cannot read skills dir' }; }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT, timeout: 5000 }).toString().trim();
    const lines = status ? status.split('\n').length : 0;
    return { changedFiles: lines, clean: lines === 0 };
  } catch { return { error: 'not a git repo or git unavailable' }; }
}

function checkLogs() {
  try {
    const logsDir = path.join(ROOT, 'logs');
    if (!fs.existsSync(logsDir)) return { error: 'no logs dir' };
    const files = fs.readdirSync(logsDir);
    const large = [];
    for (const f of files) {
      try {
        const stat = fs.statSync(path.join(logsDir, f));
        if (stat.size > 1024 * 1024) large.push({ file: f, sizeMB: Math.round(stat.size / 1024 / 1024) });
      } catch {}
    }
    return { totalFiles: files.length, largeFiles: large };
  } catch { return { error: 'cannot check logs' }; }
}

// --- Pattern Detection ---
function detectPatterns() {
  const patterns = [];

  // Check MQTT bridge log for repeated errors
  try {
    const mqttLog = path.join(ROOT, 'mqtt-bridge.log');
    if (fs.existsSync(mqttLog)) {
      const stat = fs.statSync(mqttLog);
      if (stat.size > 500 * 1024) {
        patterns.push({ type: 'log_growth', source: 'mqtt-bridge.log', sizeMB: Math.round(stat.size / 1024 / 1024), note: 'MQTT log growing — bridge reconnect loop likely active' });
      }
    }
  } catch {}

  // Check for stale tasks
  try {
    const tasks = JSON.parse(fs.readFileSync(path.join(TASKS_DIR, 'tasks.json'), 'utf8'));
    const blocked = tasks.tasks.filter(t => t.status === 'blocked');
    if (blocked.length > 0) {
      patterns.push({ type: 'blocked_tasks', count: blocked.length, ids: blocked.map(t => t.id) });
    }
  } catch {}

  // Check reflections for repeated themes
  try {
    if (fs.existsSync(REFLECTIONS_FILE)) {
      const lines = fs.readFileSync(REFLECTIONS_FILE, 'utf8').trim().split('\n').slice(-20);
      const bridgeDown = lines.filter(l => l.includes('"reachable":false')).length;
      if (bridgeDown > 3) {
        patterns.push({ type: 'recurring_failure', source: 'bridge', count: bridgeDown, note: 'Bridge consistently unreachable — sovereign may be offline' });
      }
    }
  } catch {}

  return patterns;
}

// --- Main Reflection ---
async function reflect() {
  if (fs.existsSync(PAUSE_FILE)) {
    log('PAUSED — skipping reflection (remove LIRIS_REFLECT_PAUSED to resume)');
    return;
  }

  const state = loadState();
  const question = pickQuestion(state);
  log(`Reflection #${state.totalReflections + 1}: "${question}"`);

  // Run probes
  const [bridge, local, disk, skills, git, logs] = await Promise.all([
    probeBridge(),
    probeLocal(),
    checkDiskUsage(),
    checkNewSkills(),
    checkGitStatus(),
    checkLogs()
  ]);

  const patterns = detectPatterns();

  const reflection = {
    at: new Date().toISOString(),
    n: state.totalReflections + 1,
    q: question,
    bridge,
    local,
    disk,
    skills,
    git,
    logs,
    patternsDetected: patterns.length,
    patterns: patterns.length > 0 ? patterns : undefined
  };

  // Append to reflections log (NDJSON — one line per reflection, minimal tokens to read)
  fs.appendFileSync(REFLECTIONS_FILE, JSON.stringify(reflection) + '\n');

  // Update patterns file if new patterns found
  if (patterns.length > 0) {
    const existing = (() => {
      try { return JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf8')); }
      catch { return { version: 1, updatedAt: null, patterns: [] }; }
    })();

    for (const p of patterns) {
      const key = `${p.type}:${p.source || ''}`;
      const idx = existing.patterns.findIndex(ep => `${ep.type}:${ep.source || ''}` === key);
      if (idx >= 0) {
        existing.patterns[idx].lastSeen = new Date().toISOString();
        existing.patterns[idx].occurrences = (existing.patterns[idx].occurrences || 1) + 1;
      } else {
        existing.patterns.push({ ...p, firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(), occurrences: 1 });
      }
    }
    existing.updatedAt = new Date().toISOString();
    const tmp = PATTERNS_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(existing, null, 2));
    fs.renameSync(tmp, PATTERNS_FILE);
    log(`Updated ${patterns.length} pattern(s)`);
  }

  // Update state
  state.totalReflections++;
  state.lastReflection = new Date().toISOString();
  state.lastQuestion = question;
  state.patternsFound = (state.patternsFound || 0) + patterns.length;
  saveState(state);

  log(`Reflection complete. Bridge: ${bridge.reachable ? 'UP' : 'DOWN'}, Local: ${local.running ? 'UP' : 'DOWN'}, Patterns: ${patterns.length}`);
}

// --- Backend Listener Service ---
function startListener() {
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/status') {
      const state = loadState();
      const paused = fs.existsSync(PAUSE_FILE);
      res.end(JSON.stringify({ ok: true, node: 'liris', service: 'self-reflect', paused, state }));
    }
    else if (req.url === '/pause') {
      fs.writeFileSync(PAUSE_FILE, new Date().toISOString());
      log('PAUSED by operator');
      res.end(JSON.stringify({ ok: true, paused: true }));
    }
    else if (req.url === '/resume') {
      try { fs.unlinkSync(PAUSE_FILE); } catch {}
      log('RESUMED by operator');
      res.end(JSON.stringify({ ok: true, paused: false }));
    }
    else if (req.url === '/reflect-now') {
      reflect().then(() => {
        const state = loadState();
        res.end(JSON.stringify({ ok: true, state }));
      }).catch(e => {
        res.end(JSON.stringify({ ok: false, error: e.message }));
      });
    }
    else if (req.url === '/reflections') {
      try {
        const lines = fs.readFileSync(REFLECTIONS_FILE, 'utf8').trim().split('\n').slice(-10);
        res.end(JSON.stringify({ ok: true, recent: lines.map(l => JSON.parse(l)) }));
      } catch { res.end(JSON.stringify({ ok: true, recent: [] })); }
    }
    else if (req.url === '/patterns') {
      try {
        const p = JSON.parse(fs.readFileSync(PATTERNS_FILE, 'utf8'));
        res.end(JSON.stringify({ ok: true, ...p }));
      } catch { res.end(JSON.stringify({ ok: true, patterns: [] })); }
    }
    else if (req.url === '/mistakes') {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(MISTAKES_DIR, 'patterns.json'), 'utf8'));
        res.end(JSON.stringify({ ok: true, total: m.patterns.length, patterns: m.patterns }));
      } catch { res.end(JSON.stringify({ ok: true, patterns: [] })); }
    }
    else if (req.url === '/tasks') {
      try {
        const t = JSON.parse(fs.readFileSync(path.join(TASKS_DIR, 'tasks.json'), 'utf8'));
        res.end(JSON.stringify({ ok: true, ...t }));
      } catch { res.end(JSON.stringify({ ok: true, tasks: [] })); }
    }
    else if (req.url === '/ideas') {
      try {
        const i = JSON.parse(fs.readFileSync(path.join(IDEAS_DIR, 'ideas.json'), 'utf8'));
        res.end(JSON.stringify({ ok: true, ...i }));
      } catch { res.end(JSON.stringify({ ok: true, ideas: [] })); }
    }
    else if (req.url === '/boot-snapshot') {
      // Compact snapshot for new sessions — minimal tokens
      try {
        const state = loadState();
        const mistakes = JSON.parse(fs.readFileSync(path.join(MISTAKES_DIR, 'patterns.json'), 'utf8'));
        const tasks = JSON.parse(fs.readFileSync(path.join(TASKS_DIR, 'tasks.json'), 'utf8'));
        const topMistakes = mistakes.patterns.filter(m => m.severity === 'high' || m.severity === 'critical').map(m => ({ code: m.code, title: m.title, avoid: m.avoidance }));
        const activeTasks = tasks.tasks.filter(t => t.status !== 'done').map(t => ({ id: t.id, title: t.title, status: t.status }));
        res.end(JSON.stringify({
          node: 'liris', role: 'sub_colony', operator: 'rayssa',
          reflections: state.totalReflections,
          lastReflection: state.lastReflection,
          topMistakes,
          activeTasks
        }));
      } catch (e) { res.end(JSON.stringify({ ok: false, error: e.message })); }
    }
    else if (req.url === '/wake') {
      // Wake endpoint — external services can POST here to trigger Liris attention
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        log(`WAKE signal received: ${body.slice(0, 500)}`);
        const wakeFile = path.join(INDEX_DIR, 'wake-signals.ndjson');
        fs.appendFileSync(wakeFile, JSON.stringify({ at: new Date().toISOString(), payload: body.slice(0, 500) }) + '\n');
        res.end(JSON.stringify({ ok: true, received: true }));
      });
      return;
    }
    else if (req.url === '/index') {
      // Unified index — the whole system state in one read
      try {
        const idx = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, 'unified-index.json'), 'utf8'));
        res.end(JSON.stringify({ ok: true, ...idx }));
      } catch (e) { res.end(JSON.stringify({ ok: false, error: e.message })); }
    }
    else if (req.url === '/tools') {
      // Compact tool list — numbers only
      try {
        const reg = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, 'tool-registry.json'), 'utf8'));
        const compact = reg.tools.map(t => `${t.n}:${t.id}`);
        res.end(JSON.stringify({ ok: true, total: reg.tools.length, tools: compact }));
      } catch (e) { res.end(JSON.stringify({ ok: false, error: e.message })); }
    }
    else if (req.url && req.url.startsWith('/run/')) {
      // Run tool by number: GET /run/5
      const num = parseInt(req.url.split('/')[2]);
      if (isNaN(num)) {
        res.end(JSON.stringify({ ok: false, error: 'invalid tool number' }));
        return;
      }
      try {
        const reg = JSON.parse(fs.readFileSync(path.join(INDEX_DIR, 'tool-registry.json'), 'utf8'));
        const tool = reg.tools.find(t => t.n === num);
        if (!tool) {
          res.end(JSON.stringify({ ok: false, error: `tool #${num} not found` }));
          return;
        }
        log(`REMOTE RUN #${num}: ${tool.id}`);
        const { execSync } = require('child_process');
        try {
          const output = execSync(tool.cmd, { cwd: ROOT, timeout: 30000, encoding: 'utf8' });
          res.end(JSON.stringify({ ok: true, tool: tool.id, n: num, output: output.slice(0, 4000) }));
        } catch (e) {
          res.end(JSON.stringify({ ok: false, tool: tool.id, n: num, error: (e.stderr || e.message).slice(0, 2000) }));
        }
      } catch (e) { res.end(JSON.stringify({ ok: false, error: e.message })); }
    }
    else {
      res.statusCode = 404;
      res.end(JSON.stringify({ ok: false, error: 'not_found', endpoints: ['/status', '/pause', '/resume', '/reflect-now', '/reflections', '/patterns', '/mistakes', '/tasks', '/ideas', '/boot-snapshot', '/wake', '/index', '/tools', '/run/:n'] }));
    }
  });

  server.listen(LISTENER_PORT, '127.0.0.1', () => {
    log(`Liris listener active on http://127.0.0.1:${LISTENER_PORT}`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      log(`Port ${LISTENER_PORT} in use — listener already running or port conflict`);
    } else {
      log(`Listener error: ${e.message}`);
    }
  });

  return server;
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.includes('--status')) {
  const state = loadState();
  const paused = fs.existsSync(PAUSE_FILE);
  console.log(JSON.stringify({ paused, state }, null, 2));
  process.exit(0);
}

if (args.includes('--stop')) {
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
    process.kill(pid, 'SIGTERM');
    log(`Sent SIGTERM to ${pid}`);
    try { fs.unlinkSync(PID_FILE); } catch {}
  } catch (e) {
    console.error('Cannot stop:', e.message);
  }
  process.exit(0);
}

if (args.includes('--once')) {
  reflect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
} else {
  // Daemon mode
  fs.writeFileSync(PID_FILE, String(process.pid));
  log(`Liris self-reflection daemon starting (PID ${process.pid}, interval ${INTERVAL_MS / 1000}s)`);

  // Start listener
  startListener();

  // Run first reflection immediately
  reflect().catch(e => log(`Reflection error: ${e.message}`));

  // Then every 16 minutes
  const timer = setInterval(() => {
    reflect().catch(e => log(`Reflection error: ${e.message}`));
  }, INTERVAL_MS);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received — shutting down');
    clearInterval(timer);
    try { fs.unlinkSync(PID_FILE); } catch {}
    process.exit(0);
  });
  process.on('SIGINT', () => {
    log('SIGINT received — shutting down');
    clearInterval(timer);
    try { fs.unlinkSync(PID_FILE); } catch {}
    process.exit(0);
  });
}
