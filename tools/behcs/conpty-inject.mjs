// WO-L5 conpty-inject.mjs
// Per-session ConPTY sidecar host for Claude Code on Windows.
// Scope of THIS file: host role (D8 cascade) + --list mode + inject role.
// agent-keyboard.js HTTP integration is a separate WO.
//
// Plan: C:\Users\acer\Asolaria\plans\WO-L5-CONPTY-INJECTION.md
// Mirrors the spawn-host posture of Anthropic's leaked
// C:\tmp\claude-code\src\server\web\pty-server.ts (node-pty + IPty.write).
//
// Risks addressed (plan section 8):
//   #1  node-pty install footprint: clear failure mode logged on require.
//   #4  Named-pipe ACL: explicit SD enforced by spawning a PowerShell helper
//       that creates a NamedPipeServerStream with PipeSecurity granting only
//       current-user SID + BUILTIN\Administrators (FullControl). All other
//       SIDs are implicitly denied because the DACL contains no AllowEveryone
//       ACE. This avoids the default permissive SD warning in plan §8.4.
//
// Roles in this file:
//   host    — spawn child claude.exe via node-pty, expose named pipe
//             \\.\pipe\asolaria-conpty-<sessionId> with restricted ACL,
//             register live entry in data/vault/owner/conpty/sessions.json
//   --list  — print live registry as JSON; prune dead pids in place

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Constants & paths
// ---------------------------------------------------------------------------

const ASOLARIA_ROOT  = path.resolve(__dirname, '..', '..');
const DEFAULT_REG    = path.join(ASOLARIA_ROOT, 'data', 'vault', 'owner', 'conpty', 'sessions.json');
const PIPE_PREFIX    = '\\\\.\\pipe\\asolaria-conpty-';

// Inject role defaults (plan §7.2).
// Token reused from WO-L4 (tools/agent-keyboard.js) per plan §7.2.
const DEFAULT_TOKEN_FILE = path.join(ASOLARIA_ROOT, 'data', 'vault', 'owner', 'agent-keyboard', 'token.txt');
const DEFAULT_AUDIT_LOG  = path.join(ASOLARIA_ROOT, 'logs', 'agent-keyboard.log');
const PIPE_CONNECT_TIMEOUT_MS = 2000;

// Six forbidden patterns mirrored from tools/agent-keyboard.js (FORBIDDEN_PATTERNS).
// These bytes get smuggled into a child process's stdin verbatim — same threat
// model as WO-L4, so reuse the same regexes byte-for-byte.
const FORBIDDEN_PATTERNS = [
  /\brm\s+-rf?\s/i,
  /\bdel\s+\/[fsq]/i,
  /\bformat\s+[a-z]:/i,
  /\bdiskpart\b/i,
  /Remove-Item\s+.*-Recurse\s+.*-Force/i,
  /BEGIN_DESTRUCTIVE_OP/i
];

const VALID_KEYS_INJECT = new Set([
  'ENTER', 'TAB', 'ESC', 'SPACE', 'BACKSPACE', 'DELETE',
  'HOME', 'END', 'PAGEUP', 'PAGEDOWN',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
  'UP','DOWN','LEFT','RIGHT'
]);

// ---------------------------------------------------------------------------
// CLI parsing (intentionally tiny — argv-only, no deps)
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { _: [], passthrough: [] };
  let seenDoubleDash = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (seenDoubleDash) { out.passthrough.push(a); continue; }
    if (a === '--')      { seenDoubleDash = true; continue; }
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > -1) { out[a.slice(2, eq)] = a.slice(eq + 1); continue; }
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) { out[key] = next; i++; }
      else { out[key] = true; }
      continue;
    }
    out._.push(a);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Registry helpers (atomic write, dead-pid prune)
// ---------------------------------------------------------------------------

async function readRegistry(regPath) {
  try {
    const raw = await fsp.readFile(regPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function writeRegistryAtomic(regPath, entries) {
  await fsp.mkdir(path.dirname(regPath), { recursive: true });
  const tmp = regPath + '.tmp';
  const data = JSON.stringify(entries, null, 2);
  const fh = await fsp.open(tmp, 'w');
  try {
    await fh.writeFile(data, 'utf8');
    await fh.sync();
  } finally {
    await fh.close();
  }
  await fsp.rename(tmp, regPath);
}

function pidAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try { process.kill(pid, 0); return true; }
  catch (e) { return e.code === 'EPERM'; }
}

async function pruneRegistry(regPath) {
  const entries = await readRegistry(regPath);
  const live = entries.filter(e => pidAlive(e.pid) && pidAlive(e.claudePid));
  if (live.length !== entries.length) {
    await writeRegistryAtomic(regPath, live);
  }
  return live;
}

async function addRegistryEntry(regPath, entry) {
  const entries = await readRegistry(regPath);
  const filtered = entries.filter(e => e.sessionId !== entry.sessionId);
  filtered.push(entry);
  await writeRegistryAtomic(regPath, filtered);
}

async function removeRegistryEntry(regPath, sessionId) {
  const entries = await readRegistry(regPath);
  const filtered = entries.filter(e => e.sessionId !== sessionId);
  await writeRegistryAtomic(regPath, filtered);
}

// ---------------------------------------------------------------------------
// Named pipe with explicit ACL via PowerShell NamedPipeServerStream helper.
// Plan §8.4: explicit SD = O:<userSid>G:<userSid>D:(A;;GA;;;<userSid>)(A;;GA;;;BA)
//
// Node's net.createServer over \\.\pipe\... uses CreateNamedPipeW with NULL SD.
// To enforce the plan's ACL we delegate pipe ownership to a PowerShell child
// that creates NamedPipeServerStream with a PipeSecurity object containing
// exactly two PipeAccessRule entries (current user + BUILTIN\Administrators
// FullControl, Allow). All other SIDs are denied by absence.
// The PS child bridges the pipe through its stdio so the Node host can
// pty.write incoming bytes and never holds a pipe handle itself.
// ---------------------------------------------------------------------------

function buildPsPipeHelperScript(pipeName) {
  // Single-quoted PS here-string with $pipeName substituted at the JS layer.
  // Note: pipeName is the short name passed to NamedPipeServerStream
  // (NamedPipeServerStream prepends \\.\pipe\ itself).
  return `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Core
$pipeName = '${pipeName.replace(/'/g, "''")}'
$me = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
$admins = New-Object System.Security.Principal.SecurityIdentifier(
  [System.Security.Principal.WellKnownSidType]::BuiltinAdministratorsSid, $null)
$ps = New-Object System.IO.Pipes.PipeSecurity
$ruleMe = New-Object System.IO.Pipes.PipeAccessRule(
  $me,
  [System.IO.Pipes.PipeAccessRights]::FullControl,
  [System.Security.AccessControl.AccessControlType]::Allow)
$ruleAdmin = New-Object System.IO.Pipes.PipeAccessRule(
  $admins,
  [System.IO.Pipes.PipeAccessRights]::FullControl,
  [System.Security.AccessControl.AccessControlType]::Allow)
$ps.AddAccessRule($ruleMe)
$ps.AddAccessRule($ruleAdmin)
# .NET Framework PowerShell (5.x): NamedPipeServerStreamAcl extension is in
# System.IO.Pipes via the constructor that accepts a PipeSecurity object.
$server = New-Object System.IO.Pipes.NamedPipeServerStream(
  $pipeName,
  [System.IO.Pipes.PipeDirection]::InOut,
  1,
  [System.IO.Pipes.PipeTransmissionMode]::Byte,
  [System.IO.Pipes.PipeOptions]::Asynchronous,
  4096, 4096, $ps)
[Console]::Error.WriteLine('CONPTY-PIPE-READY')
$server.WaitForConnection()
[Console]::Error.WriteLine('CONPTY-PIPE-CONNECTED')
$stdin  = [Console]::OpenStandardInput()
$stdout = [Console]::OpenStandardOutput()
# pipe -> host stdout (so Node host can route into pty.write)
$pipeToHost = [System.Threading.Tasks.Task]::Run({
  param($s, $o)
  $buf = New-Object byte[] 4096
  try {
    while ($true) {
      $n = $s.Read($buf, 0, $buf.Length)
      if ($n -le 0) { break }
      $o.Write($buf, 0, $n); $o.Flush()
    }
  } catch {}
}, @($server, $stdout))
# host stdin -> pipe (so Node host can write OOB notifications back to caller)
$hostToPipe = [System.Threading.Tasks.Task]::Run({
  param($i, $s)
  $buf = New-Object byte[] 4096
  try {
    while ($true) {
      $n = $i.Read($buf, 0, $buf.Length)
      if ($n -le 0) { break }
      $s.Write($buf, 0, $n); $s.Flush()
    }
  } catch {}
}, @($stdin, $server))
[System.Threading.Tasks.Task]::WaitAny(@($pipeToHost, $hostToPipe)) | Out-Null
try { $server.Disconnect() } catch {}
$server.Dispose()
`;
}

function startPipeHelper(pipeName, onIncomingBytes, onReady, onExit) {
  const script = buildPsPipeHelperScript(pipeName);
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });
  let readySignalled = false;
  child.stdout.on('data', (chunk) => onIncomingBytes(chunk));
  child.stderr.on('data', (chunk) => {
    const s = chunk.toString('utf8');
    if (!readySignalled && s.includes('CONPTY-PIPE-READY')) {
      readySignalled = true;
      onReady();
    }
    // Forward PS diagnostics to host stderr for debugging.
    process.stderr.write(`[pipe-helper] ${s}`);
  });
  child.on('exit', (code, sig) => onExit(code, sig));
  return child;
}

// ---------------------------------------------------------------------------
// Host-side frame parser (line-delimited JSON)
//
// Inject role writes one frame per line:
//   {"op":"write","data":"<base64>","encoding":"base64","inter_char_delay_ms":N}
//   {"op":"key","key":"ENTER"}
//
// This parser:
//   - buffers incoming bytes until \n
//   - parses each line as JSON
//   - dispatches via emit({ kind: 'write'|'key'|'malformed', ... })
//   - never throws on bad input — malformed lines surface as { kind:'malformed' }
//
// Defense-in-depth: forbidden-pattern check on decoded text occurs at dispatch
// time (handleHostFrame), not in the parser itself, so the parser stays pure.
// ---------------------------------------------------------------------------

function createHostFrameParser(emit) {
  let buf = '';
  return {
    feed(chunk) {
      // chunk is a Buffer or string. Decode as utf8.
      buf += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
      let nl;
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).replace(/\r$/, '');
        buf = buf.slice(nl + 1);
        if (line.length === 0) continue;
        let obj;
        try {
          obj = JSON.parse(line);
        } catch (e) {
          emit({ kind: 'malformed', reason: 'json_parse', detail: e.message, line });
          continue;
        }
        if (!obj || typeof obj !== 'object') {
          emit({ kind: 'malformed', reason: 'not_object', line });
          continue;
        }
        if (obj.op === 'write') {
          let bytes = null;
          const enc = obj.encoding || 'base64';
          try {
            if (typeof obj.data !== 'string') {
              emit({ kind: 'malformed', reason: 'write_no_data', line });
              continue;
            }
            if (enc === 'base64') bytes = Buffer.from(obj.data, 'base64');
            else if (enc === 'utf8' || enc === 'utf-8') bytes = Buffer.from(obj.data, 'utf8');
            else {
              emit({ kind: 'malformed', reason: 'write_bad_encoding', encoding: enc, line });
              continue;
            }
          } catch (e) {
            emit({ kind: 'malformed', reason: 'write_decode_failed', detail: e.message, line });
            continue;
          }
          const interCharDelayMs = Math.max(0, Math.min(50,
            Number.isFinite(Number(obj.inter_char_delay_ms))
              ? Number(obj.inter_char_delay_ms) : 0));
          emit({ kind: 'write', bytes, interCharDelayMs });
        } else if (obj.op === 'key') {
          const keyName = typeof obj.key === 'string' ? obj.key.toUpperCase() : '';
          if (!VALID_KEYS_INJECT.has(keyName)) {
            emit({ kind: 'malformed', reason: 'key_invalid', key: keyName, line });
            continue;
          }
          emit({ kind: 'key', key: keyName });
        } else {
          emit({ kind: 'malformed', reason: 'unknown_op', op: obj.op, line });
        }
      }
    },
    // Test helper: peek pending buffer length.
    pendingLength() { return buf.length; }
  };
}

// Map a named key to the byte sequence ConPTY expects (xterm-256color).
// CSI prefix is ESC [ ; arrow keys per VT100/xterm conventions.
function keyToEscapeSequence(keyName) {
  switch (keyName) {
    case 'ENTER':     return '\r';
    case 'TAB':       return '\t';
    case 'BACKSPACE': return '\x7f';
    case 'DELETE':    return '\x1b[3~';
    case 'ESC':       return '\x1b';
    case 'SPACE':     return ' ';
    case 'UP':        return '\x1b[A';
    case 'DOWN':      return '\x1b[B';
    case 'RIGHT':     return '\x1b[C';
    case 'LEFT':      return '\x1b[D';
    case 'HOME':      return '\x1b[H';
    case 'END':       return '\x1b[F';
    case 'PAGEUP':    return '\x1b[5~';
    case 'PAGEDOWN':  return '\x1b[6~';
    case 'F1':  return '\x1bOP';
    case 'F2':  return '\x1bOQ';
    case 'F3':  return '\x1bOR';
    case 'F4':  return '\x1bOS';
    case 'F5':  return '\x1b[15~';
    case 'F6':  return '\x1b[17~';
    case 'F7':  return '\x1b[18~';
    case 'F8':  return '\x1b[19~';
    case 'F9':  return '\x1b[20~';
    case 'F10': return '\x1b[21~';
    case 'F11': return '\x1b[23~';
    case 'F12': return '\x1b[24~';
    default:    return null;
  }
}

// Async writer that honours inter-char delay (1-3ms safe band).
// Chunk is a Buffer; pty.write expects string OR Buffer (node-pty accepts both),
// but the safe path on Windows is to write utf8 strings.
async function writeBytesWithDelay(child, bytes, interCharDelayMs) {
  if (!bytes || bytes.length === 0) return;
  if (!interCharDelayMs || interCharDelayMs <= 0) {
    child.write(bytes.toString('utf8'));
    return;
  }
  const text = bytes.toString('utf8');
  // Iterate over code points so multi-byte UTF-8 chars stay intact.
  for (const ch of text) {
    child.write(ch);
    await new Promise(r => setTimeout(r, interCharDelayMs));
  }
}

// ---------------------------------------------------------------------------
// Lazy node-pty loader with clear failure mode (plan §8.1)
// ---------------------------------------------------------------------------

async function loadNodePty() {
  try {
    const mod = await import('node-pty');
    return mod;
  } catch (e) {
    process.stderr.write(JSON.stringify({
      ok: false,
      error: 'node_pty_unavailable',
      detail: String(e && e.message || e),
      hint: 'cd ' + ASOLARIA_ROOT + ' && npm i node-pty --ignore-scripts'
    }) + '\n');
    process.exit(7);
  }
}

// ---------------------------------------------------------------------------
// Mode: --list
// ---------------------------------------------------------------------------

async function runList(args) {
  const regPath = args.register || DEFAULT_REG;
  const live = await pruneRegistry(regPath);
  process.stdout.write(JSON.stringify({
    ok: true,
    register: regPath,
    count: live.length,
    sessions: live
  }, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Mode: host
// ---------------------------------------------------------------------------

async function runHost(args) {
  const sessionId = args['session-id'] || crypto.randomUUID();
  const cols      = parseInt(args.cols || '200', 10);
  const rows      = parseInt(args.rows || '50', 10);
  const cwd       = args.cwd ? path.resolve(args.cwd) : process.cwd();
  const claudeBin = args['claude-bin'];
  const regPath   = args.register || DEFAULT_REG;
  const logPath   = args.log || null;
  const passthroughArgs = args.passthrough || [];

  if (!claudeBin) {
    process.stderr.write(JSON.stringify({
      ok: false, error: 'invalid_args', detail: '--claude-bin is required for host mode'
    }) + '\n');
    process.exit(2);
  }
  if (!fs.existsSync(claudeBin)) {
    process.stderr.write(JSON.stringify({
      ok: false, error: 'invalid_args', detail: `claude-bin not found: ${claudeBin}`
    }) + '\n');
    process.exit(2);
  }

  const pty = await loadNodePty();

  // Optional file logger (best-effort, not load-bearing).
  let logStream = null;
  if (logPath) {
    await fsp.mkdir(path.dirname(logPath), { recursive: true });
    logStream = fs.createWriteStream(logPath, { flags: 'a' });
  }
  const logLine = (obj) => {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...obj });
    if (logStream) logStream.write(line + '\n');
    process.stderr.write(line + '\n');
  };

  // 1. Spawn child claude through node-pty (ConPTY backend on Win10 1809+).
  const child = pty.spawn(claudeBin, passthroughArgs, {
    name: 'xterm-256color',
    cols, rows,
    cwd,
    env: { ...process.env, ASOLARIA_CONPTY_SESSION_ID: sessionId },
    useConpty: true
  });

  logLine({ event: 'pty_spawned', sessionId, claudePid: child.pid, claudeBin, cols, rows, cwd });

  // 2. Wire pty.onData -> host stdout (WT renders normally).
  child.onData((data) => {
    process.stdout.write(data);
  });

  // 3. Wire host stdin -> pty.write (human typing still works).
  process.stdin.setRawMode?.(true);
  process.stdin.on('data', (data) => {
    child.write(data);
  });

  // 4. Open named pipe with explicit ACL (plan §8.4) and route incoming
  //    bytes to pty.write. Pipe name carries sessionId.
  const pipeShortName = `asolaria-conpty-${sessionId}`;
  const pipeFullName  = `${PIPE_PREFIX}${sessionId}`;

  // Frame parser: line-delimited JSON. Each frame is dispatched into the pty.
  // Defense-in-depth: forbidden-pattern check re-runs on decoded text here
  // (plan §8 risk #6) — inject already screens but host MUST NOT trust it.
  const frameParser = createHostFrameParser(async (frame) => {
    try {
      if (frame.kind === 'malformed') {
        logLine({ event: 'frame_malformed', reason: frame.reason, detail: frame.detail || null });
        return;
      }
      if (frame.kind === 'write') {
        const text = frame.bytes.toString('utf8');
        const hit = checkForbiddenBytes(frame.bytes);
        if (hit) {
          logLine({ event: 'frame_forbidden', pattern: hit, len: frame.bytes.length });
          return;
        }
        await writeBytesWithDelay(child, frame.bytes, frame.interCharDelayMs);
        logLine({ event: 'frame_write', len: frame.bytes.length, delay_ms: frame.interCharDelayMs });
      } else if (frame.kind === 'key') {
        const seq = keyToEscapeSequence(frame.key);
        if (seq == null) {
          logLine({ event: 'frame_key_unmapped', key: frame.key });
          return;
        }
        child.write(seq);
        logLine({ event: 'frame_key', key: frame.key });
      }
    } catch (e) {
      logLine({ event: 'frame_dispatch_error', detail: String(e && e.message || e) });
    }
  });

  const pipeChild = startPipeHelper(
    pipeShortName,
    (incomingBytes) => {
      // Line-delimited JSON frames from inject role. Parser buffers and
      // dispatches via the emit callback above. Never crashes on bad input.
      try {
        frameParser.feed(incomingBytes);
      } catch (e) {
        logLine({ event: 'frame_feed_error', detail: String(e && e.message || e) });
      }
    },
    async () => {
      // Pipe is ready and listening — register session.
      const entry = {
        sessionId,
        pid: process.pid,
        claudePid: child.pid,
        pipe: pipeFullName,
        cwd,
        cols, rows,
        createdAt: new Date().toISOString()
      };
      await addRegistryEntry(regPath, entry);
      logLine({ event: 'registered', ...entry });
    },
    (code, sig) => {
      logLine({ event: 'pipe_helper_exited', code, signal: sig });
    }
  );

  // 5. Cleanup on exit / signal.
  const cleanup = async (reason) => {
    try { await removeRegistryEntry(regPath, sessionId); } catch {}
    try { pipeChild.kill(); } catch {}
    try { child.kill(); } catch {}
    if (logStream) try { logStream.end(); } catch {}
    logLine({ event: 'cleanup', reason });
  };

  child.onExit(async ({ exitCode, signal }) => {
    logLine({ event: 'pty_exit', sessionId, exitCode, signal });
    await cleanup('pty_exit');
    process.exit(exitCode ?? 0);
  });

  process.on('SIGINT',  () => { cleanup('SIGINT').then(() => process.exit(130)); });
  process.on('SIGTERM', () => { cleanup('SIGTERM').then(() => process.exit(143)); });
  process.on('exit',    () => { /* synchronous best-effort */ });
}

// ---------------------------------------------------------------------------
// Mode: inject (plan §7.2)
//
// Resolution order (plan §7.2):
//   1. explicit --pipe wins
//   2. --session-id → look up sessions.json
//   3. --pid → walk registry for matching claudePid
//   4. none → exit 4 with {ok:false, code:404, error:"no_route"}
//
// Auth: bearer token from --token-file (default agent-keyboard/token.txt,
// reused from WO-L4). Validated against env WOL5_TOKEN if set; else accepted
// (informational gate, matches "If env WOL5_TOKEN is set, else accept").
//
// Forbidden-pattern check: 6 patterns mirrored from agent-keyboard.js.
// Reject 403 on match.
//
// Pipe connection: 2s timeout. Frame protocol (matches host's pty.write loop):
//   {"op":"write","data":"<utf8 text>"}\n        — write text to pty stdin
//   {"op":"key","key":"ENTER"}\n                 — press a named key
// The current host (cascade-1) pipes raw bytes from the named pipe straight
// into pty.write, so we ALSO write the raw payload bytes for compatibility
// when the JSON op is "write". The JSON wrapper is what a future ACK-aware
// host (separate WO) will parse; the current host ignores the JSON envelope
// and just writes everything to the pty, which is acceptable because that's
// the same effect we want.
//
// Fire-and-forget: no ACK protocol exists yet (plan §5 leaves ACK to a
// separate WO). We close the pipe write end after the bytes flush.
// ---------------------------------------------------------------------------

import net from 'node:net';

function failJson(code, body) {
  process.stdout.write(JSON.stringify(Object.assign({ ok: false, code }, body)) + '\n');
  process.exit(4);
}

function okJson(body) {
  process.stdout.write(JSON.stringify(Object.assign({ ok: true, code: 200, path: 'conpty_inject' }, body)) + '\n');
}

function sha256Prefix8Bytes(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

async function appendAuditLine(auditPath, fields) {
  try {
    await fsp.mkdir(path.dirname(auditPath), { recursive: true });
    const ts = new Date().toISOString();
    // Match agent-keyboard.js audit() shape: "[ts] field=val field=val ..."
    // Verb token is "conpty_inject" (plan §7.4 / §8.7).
    const parts = ['conpty_inject'];
    for (const k of Object.keys(fields)) {
      const v = fields[k];
      if (v === undefined || v === null) continue;
      parts.push(`${k}=${String(v).replace(/[\r\n]/g, ' ')}`);
    }
    const line = `[${ts}] ${parts.join(' ')}\n`;
    await fsp.appendFile(auditPath, line, 'utf8');
  } catch (e) {
    // Audit failure must not break the call. Surface to stderr only.
    process.stderr.write(`[audit_failed] ${e.message}\n`);
  }
}

function checkForbiddenBytes(textOrBuf) {
  // Forbidden patterns operate on the decoded UTF-8 text view of the payload.
  // (plan §8.6: forbidden-pattern check applies to bytes, not characters —
  // implementation: decode UTF-8 once and run the 6 regexes over the string.
  // Non-UTF-8 raw payloads would need a separate higher-trust path which is
  // out of scope here.)
  let text;
  if (Buffer.isBuffer(textOrBuf)) {
    text = textOrBuf.toString('utf8');
  } else {
    text = String(textOrBuf || '');
  }
  for (const re of FORBIDDEN_PATTERNS) {
    if (re.test(text)) return re.toString();
  }
  return null;
}

function readTokenFile(tokenPath) {
  try {
    return fs.readFileSync(tokenPath, 'utf8').trim();
  } catch (e) {
    return null;
  }
}

function checkAuthInject(args) {
  // Informational gate: if env WOL5_TOKEN is set, the bearer token loaded
  // from --token-file MUST equal WOL5_TOKEN. If WOL5_TOKEN is unset, we
  // still attempt to load the token (so audit can record it) but accept
  // the call. This matches plan §7.2: "Validate against env WOL5_TOKEN
  // if set, else accept (informational gate)."
  const tokenPath = args['token-file'] || DEFAULT_TOKEN_FILE;
  const present = readTokenFile(tokenPath);
  const required = process.env.WOL5_TOKEN || null;
  if (required) {
    if (!present) {
      return { ok: false, error: 'auth_denied', detail: 'token_file_unreadable', tokenPath };
    }
    if (present !== required) {
      return { ok: false, error: 'auth_denied', detail: 'token_mismatch', tokenPath };
    }
  }
  return { ok: true, tokenPath, tokenPresent: !!present, enforced: !!required };
}

async function resolveRoute(args) {
  // Returns { sessionId, claudePid, pipe } or throws-via-failJson on no_route.
  // Order: --pipe > --session-id > --pid.
  const explicitPipe = typeof args.pipe === 'string' && args.pipe ? args.pipe : null;
  if (explicitPipe) {
    return {
      sessionId: args['session-id'] || null,
      claudePid: args.pid ? Number(args.pid) : null,
      pipe: explicitPipe,
      source: 'explicit_pipe'
    };
  }

  const regPath = args.register || DEFAULT_REG;
  let entries;
  try {
    entries = await readRegistry(regPath);
  } catch (e) {
    return null;
  }

  if (typeof args['session-id'] === 'string' && args['session-id']) {
    const sid = args['session-id'];
    const hit = entries.find(e => e.sessionId === sid);
    if (hit) {
      return {
        sessionId: hit.sessionId,
        claudePid: hit.claudePid,
        pipe: hit.pipe,
        source: 'session_id'
      };
    }
    return null;
  }

  if (args.pid !== undefined && args.pid !== null && args.pid !== '') {
    const pid = Number(args.pid);
    if (!Number.isFinite(pid)) return null;
    const hit = entries.find(e => Number(e.claudePid) === pid);
    if (hit) {
      return {
        sessionId: hit.sessionId,
        claudePid: hit.claudePid,
        pipe: hit.pipe,
        source: 'pid'
      };
    }
    return null;
  }

  return null;
}

function pipeNameToShort(pipeFullName) {
  // net.connect on Windows accepts the full \\.\pipe\<name> form via the
  // 'path' option directly. No translation needed.
  return pipeFullName;
}

function connectPipeWithTimeout(pipeFullName, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const sock = net.connect({ path: pipeNameToShort(pipeFullName) });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { sock.destroy(); } catch {}
      reject(new Error('pipe_connect_timeout'));
    }, timeoutMs);
    sock.once('connect', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(sock);
    });
    sock.once('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

function writeFrameAndFlush(sock, frameObj) {
  return new Promise((resolve, reject) => {
    const line = JSON.stringify(frameObj) + '\n';
    sock.write(line, 'utf8', (err) => {
      if (err) return reject(err);
      resolve(line.length);
    });
  });
}

async function runInject(args) {
  const auditPath = args.audit || DEFAULT_AUDIT_LOG;

  // 1. Validate input — exactly one of --text / --text-b64 / --key.
  const hasText    = typeof args.text === 'string';
  const hasTextB64 = typeof args['text-b64'] === 'string';
  const hasKey     = typeof args.key === 'string';
  const inputCount = (hasText ? 1 : 0) + (hasTextB64 ? 1 : 0) + (hasKey ? 1 : 0);
  if (inputCount === 0) {
    return failJson(400, { error: 'invalid_args', detail: 'one of --text / --text-b64 / --key required' });
  }
  if (inputCount > 1) {
    return failJson(400, { error: 'invalid_args', detail: 'only one of --text / --text-b64 / --key allowed' });
  }

  let payloadText = '';
  let payloadBuf = null;
  let keyName = null;
  if (hasText) {
    payloadText = String(args.text);
    payloadBuf = Buffer.from(payloadText, 'utf8');
  } else if (hasTextB64) {
    try {
      payloadBuf = Buffer.from(String(args['text-b64']), 'base64');
      payloadText = payloadBuf.toString('utf8');
    } catch (e) {
      return failJson(400, { error: 'invalid_args', detail: 'bad base64: ' + e.message });
    }
  } else if (hasKey) {
    keyName = String(args.key).toUpperCase();
    if (!VALID_KEYS_INJECT.has(keyName)) {
      return failJson(400, { error: 'invalid_args', detail: 'invalid key: ' + keyName });
    }
  }

  const pressEnter = args['press-enter'] === true || args['press-enter'] === 'true';
  const interCharDelayMs = Math.max(0, Math.min(50,
    Number.isFinite(Number(args['inter-char-delay-ms'])) ? Number(args['inter-char-delay-ms']) : 2));

  // 2. Auth gate (informational unless WOL5_TOKEN is set).
  const auth = checkAuthInject(args);
  if (!auth.ok) {
    await appendAuditLine(auditPath, {
      session_id: args['session-id'] || '',
      pipe: args.pipe || '',
      outcome: auth.error,
      detail: auth.detail
    });
    return failJson(401, { error: auth.error, detail: auth.detail, token_file: auth.tokenPath });
  }

  // 3. Forbidden-pattern check (text payloads only — keys bypass).
  if (payloadBuf) {
    const hit = checkForbiddenBytes(payloadBuf);
    if (hit) {
      await appendAuditLine(auditPath, {
        session_id: args['session-id'] || '',
        pipe: args.pipe || '',
        len: payloadBuf.length,
        sha256_8: sha256Prefix8Bytes(payloadBuf),
        outcome: 'forbidden_pattern',
        pattern: hit
      });
      return failJson(403, { error: 'forbidden_pattern', pattern: hit });
    }
  }

  // 4. Resolve route.
  const route = await resolveRoute(args);
  if (!route || !route.pipe) {
    await appendAuditLine(auditPath, {
      session_id: args['session-id'] || '',
      claude_pid: args.pid || '',
      pipe: '',
      outcome: 'no_route',
      detail: 'no matching session/pid/pipe'
    });
    return failJson(404, {
      error: 'no_route',
      detail: 'no live session matched the requested selector',
      session_id: args['session-id'] || null,
      claude_pid: args.pid ? Number(args.pid) : null,
      register: args.register || DEFAULT_REG
    });
  }

  // 5. Connect to pipe with 2s timeout.
  let sock;
  try {
    sock = await connectPipeWithTimeout(route.pipe, PIPE_CONNECT_TIMEOUT_MS);
  } catch (e) {
    await appendAuditLine(auditPath, {
      session_id: route.sessionId || '',
      claude_pid: route.claudePid || '',
      pipe: route.pipe,
      outcome: 'pipe_write_failed',
      detail: 'connect: ' + e.message
    });
    return failJson(502, {
      error: 'pipe_write_failed',
      detail: 'connect: ' + e.message,
      session_id: route.sessionId,
      pipe: route.pipe
    });
  }

  // 6. Write JSON frame(s). Fire-and-forget per plan §7.2.5.
  try {
    let frame;
    if (keyName) {
      frame = { op: 'key', key: keyName };
    } else {
      // Carry the payload as base64 in JSON to keep the frame valid even if
      // the payload contains control bytes / quotes / newlines.
      frame = {
        op: 'write',
        data: payloadBuf.toString('base64'),
        encoding: 'base64',
        inter_char_delay_ms: interCharDelayMs
      };
    }
    await writeFrameAndFlush(sock, frame);

    if (pressEnter && !keyName) {
      // Optional follow-up ENTER (only for text payloads).
      await writeFrameAndFlush(sock, { op: 'key', key: 'ENTER' });
    }
  } catch (e) {
    try { sock.destroy(); } catch {}
    await appendAuditLine(auditPath, {
      session_id: route.sessionId || '',
      claude_pid: route.claudePid || '',
      pipe: route.pipe,
      outcome: 'pipe_write_failed',
      detail: 'write: ' + e.message
    });
    return failJson(502, {
      error: 'pipe_write_failed',
      detail: 'write: ' + e.message,
      session_id: route.sessionId,
      pipe: route.pipe
    });
  }

  // Close write side; we're not waiting for an ACK (no protocol yet).
  try { sock.end(); } catch {}

  const len = payloadBuf ? payloadBuf.length : 0;
  const sha8 = payloadBuf ? sha256Prefix8Bytes(payloadBuf) : '';

  await appendAuditLine(auditPath, {
    session_id: route.sessionId || '',
    claude_pid: route.claudePid || '',
    pipe: route.pipe,
    len,
    sha256_8: sha8,
    key: keyName || '',
    press_enter: pressEnter ? '1' : '0',
    route_source: route.source,
    auth_enforced: auth.enforced ? '1' : '0',
    outcome: 'ok'
  });

  return okJson({
    session_id: route.sessionId,
    claude_pid: route.claudePid,
    pipe: route.pipe,
    typed: keyName ? 0 : len,
    key: keyName,
    press_enter: pressEnter,
    sha256_8: sha8,
    ts: new Date().toISOString()
  });
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);

  if (args.list) return runList(args);
  if (args._[0] === 'host')   return runHost(args);
  if (args._[0] === 'inject') return runInject(args);

  process.stderr.write([
    'usage:',
    '  node tools/behcs/conpty-inject.mjs host \\',
    '    --session-id <uuid> --cols 200 --rows 50 \\',
    '    --cwd <abs-path> --claude-bin <path> \\',
    '    [--register <sessions.json>] [--log <log-path>] -- [args...]',
    '',
    '  node tools/behcs/conpty-inject.mjs inject \\',
    '    (--session-id <uuid> | --pid <claudePid> | --pipe <\\\\.\\pipe\\...>) \\',
    '    (--text "..." | --text-b64 <b64> | --key ENTER) \\',
    '    [--press-enter] [--inter-char-delay-ms 2] \\',
    '    [--token-file <path>] [--audit <path>] [--register <sessions.json>]',
    '',
    '  node tools/behcs/conpty-inject.mjs --list [--register <sessions.json>]',
    ''
  ].join('\n'));
  process.exit(2);
}

// Test-only exports (pure functions; no side effects on import).
export { createHostFrameParser, keyToEscapeSequence, checkForbiddenBytes };

// Only run main() when this file is invoked directly (not when imported by tests).
const invokedDirectly = (() => {
  try {
    const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : '';
    return argv1 === path.resolve(__filename);
  } catch { return true; }
})();

if (invokedDirectly) {
  main().catch((e) => {
    process.stderr.write(JSON.stringify({
      ok: false, error: 'host_fatal', detail: String(e && e.stack || e)
    }) + '\n');
    process.exit(1);
  });
}
