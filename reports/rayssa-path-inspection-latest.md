# Rayssa Path Inspection Prep - 2026-03-22 17:52 -03:00

## Conclusion

- Rayssa's `LIRIS` path is documented locally as a sub-colony/external-node path.
- I do NOT find local evidence that it was activated by a Google-account security shell.
- The durable evidence points instead to bridge relay + sender-policy + MQTT + WhatsApp relay, with optional SSH and a suspect direct `4799` side channel.
- On this host today, the documented external-node bridge surfaces are mostly defined on disk but not currently live.
- After the live policy/registry inspection, the strongest current reading is: Rayssa's friend lane is staged pack material plus stale instructions, not a live registered bridge lane on this host.
- A correction packet has now been appended to the Liris inbox redirecting the QDD smoke return path away from dead `4799` and back to the manual owner relay.

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

## Live Policy / Registry Reality — Pass 2

- The live airlock rooms are `asolaria_external`, `asolaria_internal`, `asolaria_ops`, `asolaria_bridge`, and `jarvis_boss_bridge`.
- `asolaria-friend-rayss` is not present in the live airlock policy.
- The live sender-token map does not include `rayss-codex`, `gaia`, or `liris`.
- `codex-bridge\agents-registry.json` is still anchored on room `asolaria_bridge` and only allowlists `asolaria`, `vector`, `rook`, `forge`, `falcon`, and `watchdog`.
- `codex-bridge\data\` persists only `asolaria_bridge.json` and `jarvis_boss_bridge.json`; there is no persisted friend-room file for Rayssa.
- The Rayssa friend pack exists under `reports\friend-codex-bridge-packs\20260318-004427-rayssa\`, but it appears unmerged into live host policy and registry.
- The friend profile declares `requireRoomPolicy=true`, but that key was not found in the scanned `colony-agent-bot.js`, so that enforcement is not code-verified from the host side.
- `bridgectl.ps1 -Command status` currently reports both local relay health and tunnel health failing.
- The current QDD smoke note still instructs `Liris` to send results to `http://192.168.1.3:4799/msg`, but nothing is listening on `4799`.

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

1. Decide one real QDD return lane: merged friend room, restored `@liris` on `asolaria_bridge`, or manual/WhatsApp relay.
2. If the friend room is chosen, merge `asolaria-friend-rayss` into live airlock policy plus sender-token config and verify it persists into runtime state.
3. If the temporary/manual path is chosen, remove the dead `4799` instruction from QDD smoke packets and keep the preservation order explicit.
4. Reconcile the dead bridge/tunnel state before trusting any relay-based return path.
5. Keep every finding indexed; do not rely on raw chat replay.
