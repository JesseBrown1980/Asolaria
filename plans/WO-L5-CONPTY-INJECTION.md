# WO-L5 — ConPTY-Level Keystroke Injection for Targeted Claude Code Sessions

Date: 2026-04-28
Class: WO-L5 architectural plan (successor to WO-L4)
Status: PROPOSED — ARCHITECTURE-ONLY
Runtime binding: false
Router binding: false
Server start permission: false
Source behavior change: planned (replaces WO-L4 default for multi-session-per-WT-instance case only)

## Parents

- WO-L4: `tools/agent-keyboard.js` (PostMessage WM_CHAR HWND-targeted injection)
- Architectural ceiling discovered 2026-04-28 (this document is the response)
- Leaked Claude Code reference: `C:\tmp\claude-code\src\server\web\pty-server.ts`, `C:\tmp\claude-code\src\server\web\session-manager.ts`

## 1. Goal

Deliver a per-session keystroke-injection mechanism on Windows that addresses one specific Claude Code child process — even when multiple Claude sessions share a single Windows Terminal HWND across tabs/panes — by writing directly to that session's ConPTY stdin pipe rather than to the shared Win32 window queue. Must preserve WO-L4's "no foreground steal" property, must add no new always-on attack surface beyond what WO-L4 already gates (six security gates), and must degrade gracefully to the WO-L4 PostMessage path when ConPTY targeting is unavailable or unwanted.

## 2. Current ceiling — WO-L4 limits and evidence

WO-L4 calls `user32!PostMessage(hwnd, WM_CHAR, ch, 0)` per character with WM_KEYDOWN/UP for special keys. Targeting is by HWND.

The discovered ceiling: a Windows Terminal `WindowsTerminal.exe` process owns exactly one top-level HWND (the window frame). Tabs and panes within that window are not separate HWNDs — they are internal XAML islands rendered into the same surface. WM_CHAR posted to the WT HWND is dispatched to the focused control of the active tab. Therefore:

- Two `claude` sessions opened as two tabs of the same WT window share one HWND. WO-L4 posts to that HWND, the active-tab terminal control consumes it, and the inactive-tab session never sees the bytes.
- Forcing tab activation re-introduces foreground/focus mutation, forbidden per `feedback_never_steal_foreground.md` (2026-04-20 Abacus incident).
- WT does not expose per-tab HWNDs to Win32 enumeration APIs.

**Win32 is the wrong layer.** Bytes need to go to the right `claude.exe`, not the right window.

## 3. ConPTY architecture on Windows

ConPTY (Pseudo Console) is the modern Windows pseudo-terminal API (Windows 10 1809+).

1. Host process calls `kernel32!CreatePseudoConsole(size, hInput, hOutput, flags, &hPC)` — returns opaque `HPCON`. Host owns two anonymous pipes: write end into child, read end from child.
2. Host then calls `CreateProcessW` with `EXTENDED_STARTUPINFO` whose attribute list contains `PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE` set to `hPC`. Windows attaches the new process's stdin/stdout/stderr to the kernel side of the ConPTY.
3. Each Claude Code session has its own ConPTY → its own dedicated input-pipe write handle.

Critical property: writing to that handle delivers bytes to exactly that child's stdin, regardless of which WT tab is foreground, regardless of HWND focus, regardless of whether the WT window is even visible.

**Cross-process visibility:** anonymous pipe handles are not duplicatable from outside the host without `PROCESS_DUP_HANDLE` access (WT does not grant this). WT has no documented IPC for "give me your conpty input handle for tab N." Therefore obtaining a writable handle requires either (a) being the spawning host yourself, or (b) injecting into WT, or (c) wrapping `claude.exe` so that *we* are the host.

The leaked Claude Code source proves this architecture is the standard one Anthropic uses in production:

- `C:\tmp\claude-code\src\server\web\pty-server.ts` line 5: `import { spawn } from "node-pty";`
- `pty-server.ts` lines 110-124: spawns `CLAUDE_BIN` through node-pty with explicit cols/rows/cwd/env
- `session-manager.ts` line 1: `import type { IPty } from "node-pty";`
- `session-manager.ts` line 299: `pty.write(str);` — same primitive, driven by a WebSocket
- `session-manager.ts` lines 245-253: `pty.onData` callback fans output back to session-specific WebSocket

Anthropic's web bridge solves the same problem WO-L5 needs to solve, by being the spawn host. WO-L5 should adopt that posture.

## 4. Approach options

### A. WT control-protocol nudge
Use `wt.exe --window N --focus-tab K` then PostMessage WM_CHAR.

### B. Kernel-level keystroke injector
Install kernel-mode keyboard filter driver or use Interception/equivalent.

### C. `claude.exe` wrapper that exposes a control pipe (sidecar host)
Replace direct `claude.exe` launches with a thin Node host that uses `node-pty` to spawn `claude` and exposes a Windows named pipe (`\\.\pipe\asolaria-claude-<sessionId>`) into which authorized callers write keystroke bytes.

### D. WT-instance injection / DLL-side-load
Inject a DLL into running `WindowsTerminal.exe`, locate per-tab `ConhostConnection`'s input pipe, `DuplicateHandle` it back, then `WriteFile` directly.

### E. Mark-and-route via WO-L4
Each session prints a unique nonce on startup; pre-injection query confirms target.

## 5. Trade-offs

### A. WT control-protocol nudge
- Blast radius: low. Complexity: low.
- Security: weak — re-introduces foreground/focus issue. Race-prone. Doesn't actually solve the ceiling.
- **Verdict:** not a solution; fallback only when single-tab WT is detected.

### B. Kernel-level injector
- Blast radius: catastrophic — driver, signing, BSOD risk, EDR/AV will flag.
- Complexity: very high. Security: hostile (indistinguishable from malware to anti-cheat/DLP/EDR).
- **Verdict:** rejected.

### C. `claude.exe` wrapper / sidecar host (named-pipe control)
- Blast radius: bounded — one Node process per session, one named pipe per session, ACL'd to user SID.
- Complexity: moderate. ~150 LoC node-pty host + control protocol + reuse of WO-L4's six security gates.
- Security: strong by construction. No kernel surface, no DLL injection, no foreground/focus mutation, localhost-only.
- **Verdict:** architecturally clean. Mirrors Anthropic's own design.

### D. WT DLL injection
- Blast radius: high — modifies a Microsoft Store-distributed process. WT auto-updates can shift offsets and break us silently.
- Complexity: very high. Permanent maintenance burden.
- Security: ambiguous (malware-shaped). Will trip EDR.
- **Verdict:** rejected.

### E. Marker-based routing via WO-L4
- Bytes still go to active tab only. Marker only helps detect wrong-tab case, doesn't deliver.
- **Verdict:** rejected as primary; adopt as defensive check inside Option C.

## 6. Recommended path

**Adopt Option C: a `claude.exe` wrapper sidecar host that exposes a per-session named-pipe control endpoint.**

Rationale:
1. Only option that actually clears the ceiling — bytes go to the exact `claude.exe` regardless of WT tab focus, because we own the ConPTY input handle directly via `node-pty`'s `IPty.write`.
2. Mirrors the architecture Anthropic itself uses in the leaked web bridge. Composes cleanly with upstream's model.
3. Reuses unchanged the six security gates already audited in `tools/agent-keyboard.js`. New attack surface is exactly one named pipe per running Claude session, ACL'd to the local user SID, addressable only from localhost.
4. Cleanly composes with WO-L4: when the wrapper is not in use, agent-keyboard falls back to WO-L4 PostMessage and emits a structured warning that targeting is HWND-only.
5. No kernel code, no DLL injection, no foreground steal, no WT internals reverse-engineering, no driver signing.

Ceiling: only sessions launched via the wrapper are addressable through it. Sessions launched by hand fall back to WO-L4. Acceptable — `Start-Asolaria-*.cmd` launchers can route through the wrapper.

## 7. API surface — `tools/behcs/conpty-inject.mjs`

Two roles, one file. Role selected by argv.

### 7.1 Host role (one process per Claude session)

```
node tools/behcs/conpty-inject.mjs host \
  --session-id <uuid> \
  --cols 200 --rows 50 \
  --cwd <abs-path> \
  --claude-bin <path-to-claude.exe-or-cmd> \
  [--register data/vault/owner/conpty/sessions.json] \
  [--log logs/conpty-inject-<sessionId>.log] \
  -- [args passed verbatim to claude.exe]
```

- Spawns `claude` via `node-pty` (Windows ConPTY backend).
- Creates Windows named pipe `\\.\pipe\asolaria-conpty-<sessionId>` with security descriptor allowing current user SID + `BUILTIN\Administrators` only.
- Wires `pty.onData` → host's stdout (WT renders normally).
- Wires `process.stdin` → `pty.write` (human typing still works).
- Wires named pipe → `pty.write` for accepted JSON frames.
- Writes one line to registry on creation, removes on `pty.onExit`:
  `{"sessionId":"...","pid":<host-pid>,"claudePid":<child-pid>,"pipe":"\\\\.\\pipe\\asolaria-conpty-...","createdAt":"<iso>"}`

### 7.2 Inject role (one-shot CLI, called by `agent-keyboard.js` or directly)

```
node tools/behcs/conpty-inject.mjs inject \
  --session-id <uuid>          # OR --pid <claudePid> OR --pipe <\\.\pipe\...>
  --text "literal text"        # OR --text-b64 <base64>  OR --key ENTER
  [--press-enter]
  [--inter-char-delay-ms 2]
  [--token-file <path>]        # default reused from WO-L4
  [--audit logs/agent-keyboard.log]
```

Resolution: explicit `--pipe` wins; else `--session-id` looks up `sessions.json`; else `--pid` walks for matching `claudePid`. If none resolve, exit 4 with `error: "no_route"`.

### 7.3 Response shape

Success: `{ok, code:200, path:"conpty_inject", session_id, claude_pid, pipe, typed, press_enter, ts}`

Failure: `{ok:false, code, error, detail, session_id, fallback_hint}` where error ∈ `session_exited|invalid_args|no_route|pipe_write_failed|auth_denied`.

### 7.4 HTTP integration with `agent-keyboard.js`

`/type` and `/press` gain new accepted body fields:
- `target_session_id: "<uuid>"` — preferred, routes via conpty-inject
- `target_claude_pid: <int>` — alternative routing

Resolution order:
1. `target_session_id` or `target_claude_pid` resolves → ConPTY path. Audit `conpty_inject`.
2. Route fails with `no_route` → downgrade to WO-L4 ONLY if `window_id` also present; otherwise 404. Never silently fall back when caller asked for ConPTY targeting.
3. Neither field present → behaves as today (WO-L4 path).

All six existing security gates run before routing decision.

### 7.5 Session registry hygiene

- `data/vault/owner/conpty/sessions.json` rewritten atomically (write to `.tmp`, fsync, rename).
- Both daemon startup and `inject` mode prune entries with dead `claudePid` (`process.kill(pid, 0)` probe).
- `--list` mode prints live registry as JSON for diagnostics.

## 8. Open questions / risks

1. **node-pty install footprint.** Native bindings per Node ABI. Asolaria's bundled Node version on Acer must match the prebuild, or vendor a prebuilt `pty.node` per host.
2. **Wrapper adoption coverage.** Only protects sessions launched through it. Audit which paths spawn `claude.exe` (`Start-Asolaria-*.cmd`, federation tooling, MCP launchers, manual launches).
3. **Resize semantics.** ConPTY needs resize when terminal control resizes. Wrapper sits between WT and `claude`; forward `WINDOW_BUFFER_SIZE_EVENT` to `pty.resize(cols, rows)`.
4. **Named-pipe ACL correctness.** Default `CreateNamedPipeW` with `null` SD is permissive. Construct explicit SD: `O:<userSid>G:<userSid>D:(A;;GA;;;<userSid>)(A;;GA;;;BA)`. Verify with `accesschk`.
5. **Rate-limit interaction with WO-L4.** WO-L4's per-IP 300ms limit at HTTP layer applies; ConPTY routing inherits it.
6. **Forbidden-pattern check applies to bytes, not characters.** `--text-b64` payloads must decode to valid UTF-8 unless `--raw-bytes` flag is given (gated behind higher trust tier).
7. **Telemetry alignment.** Emit `conpty_inject` with same field set as `pid_targeted_inject` plus `session_id` and `claude_pid`.
8. **`claude.exe` is itself a `.cmd` shim.** Verify ConPTY inheritance through the shim. If shim creates new console, spawn `node` directly with resolved JS path.
9. **Interaction with WT's own ConPTY.** Two ConPTYs in series: WT → wrapper → claude. Validate escape sequence pass-through (mouse reporting, bracketed paste, alternate screen, OSC 52).
10. **Fallback policy clarity.** Document explicitly: if caller specifies `target_session_id`, never silently downgrade to WO-L4. Failure returns error with `fallback_hint`; caller decides.

## Critical Files for Implementation

- C:\Users\acer\Asolaria\tools\behcs\conpty-inject.mjs (NEW — wrapper host + inject CLI)
- C:\Users\acer\Asolaria\tools\agent-keyboard.js (modify — accept `target_session_id`/`target_claude_pid`, route to conpty-inject before WO-L4 fallback)
- C:\Users\acer\Asolaria\data\vault\owner\conpty\sessions.json (NEW registry)
- C:\Users\acer\Asolaria\Start-Asolaria-*.cmd launchers (modify — route `claude` through `conpty-inject.mjs host`)
- C:\tmp\claude-code\src\server\web\session-manager.ts (REFERENCE only)
