# Rayssa Path Inspection Prep - 2026-03-22 17:52 -03:00

## Conclusion

- Rayssa's `LIRIS` path is documented locally as a sub-colony/external-node path.
- I do NOT find local evidence that it was activated by a Google-account security shell.
- The durable evidence points instead to bridge relay + sender-policy + MQTT + WhatsApp relay, with optional SSH and a suspect direct `4799` side channel.
- On this host today, the documented external-node bridge surfaces are mostly defined on disk but not currently live.

## Evidence Chain

- `reports/helm-controller-packet-latest.md` and `runtime/local-claude-profile.md` still describe `Liris`/Rayssa as a remote sub-colony node.
- `runtime/outbound-liris-inbox.ndjson` shows Gaia explicitly falling back to WhatsApp relay until Asolaria restart plus bridge sender-policy registration.
- `reports/friend-codex-bridge-packs/20260318-004427-rayssa/README.md` defines a dedicated friend bridge room `asolaria-friend-rayss` with sender handle `rayss-codex`.
- `reports/friend-codex-bridge-packs/20260318-004427-rayssa/rayss-codex.env.example` shows the required bridge variables:
  - `CODEX_BRIDGE_URL`
  - `CODEX_BRIDGE_TOKEN`
  - `CODEX_BRIDGE_SENDER_TOKEN_RAYSS_CODEX`
- `tools/gaia-liris-bridge.js` defines an unauthenticated direct bridge on `0.0.0.0:4799`.

## Live PID / Port Attachment

| Surface | Current truth on 2026-03-22 | Attached PID state |
|---|---|---|
| Main Asolaria runtime | listening on `0.0.0.0:4781` | PID `376` (`node`) |
| Local MQTT broker | listening on `127.0.0.1:18883` | PID `16828` (`node`) |
| Bridge relay | `8788` not listening; `/api/health/fast` says `running=false` | pid-file exists but is empty; health reports `pid=0` |
| Cloudflared quick tunnel | bridge tunnel not running | pid-file exists but is empty; health reports `pid=0` |
| Notify bot | not running | pid-file exists but is empty; health reports `pid=0` |
| Gaia admin sidecar | stale state only | `runtime/admin-terminals/gaia/sidecar.pid` contains `35552`, but no OS process with PID `35552` is alive; last known child `22716` is also gone |
| Liris admin sidecar | exited/offline | pid-file exists but is empty; health reports `sidecarPid=0` |

## Skills Needed

- Bridge archaeology: inspect relay config, sender-policy, room mapping, and token-handshake assumptions without exposing secrets.
- Windows PowerShell + Node ops: verify pid-files, listeners, launcher scripts, and local process state.
- Index-language discipline: compress findings into IX/LX memory without leaking tokens, URLs, or transient auth state.
- QDD relay discipline: keep remote testing/status exchange bounded, stepwise, and reversible while external-node links remain temporary.
- Security-boundary review: distinguish message relay, local executor, and direct side-channel surfaces before promoting any connection.

## Programs Needed

### Required on Jesse host

- `powershell`
- `C:\nvm4w\nodejs\node.exe`
- `C:\nvm4w\nodejs\codex.ps1` plus access to `codex.cmd`
- `C:\Program Files\Git\cmd\git.exe`
- `C:\Program Files\Tailscale\tailscale.exe`
- `C:\Program Files (x86)\cloudflared\cloudflared.exe`

### Required on Rayssa machine for the friend-bridge pack

- `node`
- `codex`
- access to `codex.cmd`
- a shell that can set the bridge env vars locally

### Optional collaborator surfaces, not required for this inspection

- `C:\Program Files\Cursor\Cursor.exe`
- `C:\Users\acer\AppData\Local\Programs\Antigravity\Antigravity.exe`
- `C:\Users\acer\AppData\Local\Programs\AbacusAI\AbacusAI.exe`

## Bridges Needed

### Primary structured bridge

- `codex-bridge` relay room: `asolaria-friend-rayss`
- sender handle: `rayss-codex`
- allowed supervisors named in the pack: `vector`, `helm`
- required controls:
  - relay bearer token
  - sender token
  - sender-policy registration

### Temporary fallback bridge

- WhatsApp/Jesse manual relay remains the documented fallback while proper sender-policy registration is unresolved.

### Suspect/manual side channel

- direct `4799` HTTP bridge from `tools/gaia-liris-bridge.js`
- currently NOT listening on this host
- keep treated as unaudited and temporary only

### Optional file-sync lane

- SSH remains a valid inspection target per older plans, but current local evidence does not show it as the live path right now.

## Temporary QDD Order

Jesse's standing order for this inspection:

- Keep the temporary, unlicensed connection between the external nodes in place while QDD is active.
- Do NOT dismantle that path before QDD is fully ready and Jesse has personally confirmed the visual status himself.
- Reason: current infrastructure cannot support re-establishing these links by launching large agent waves just to rebuild connection state right now.

This order is a preservation exception, not permission to widen privileges. Do not use it to:

- add startup automation
- mint or copy new secrets into public memory
- promote external nodes into higher authority roles

## Inspection Start Order

1. Confirm which path is actually carrying QDD handoff right now: WhatsApp relay, friend bridge room, or another residual lane.
2. Verify whether `codex-bridge` sender-policy currently knows `rayss-codex`, `gaia`, or `liris`.
3. Check whether any residual tunnel URL or relay policy is still bound to the Rayssa room.
4. Re-check `4799`, `8788`, and `18886` only after the preservation order is understood, so we do not kill the wrong bridge.
5. Keep every finding indexed; do not rely on raw chat replay.
