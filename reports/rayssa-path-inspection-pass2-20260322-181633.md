# Rayssa Path Inspection — Pass 2 - 2026-03-22 18:16 -03:00

## New Findings

- The live airlock room set is:
  - `asolaria_external`
  - `asolaria_internal`
  - `asolaria_ops`
  - `asolaria_bridge`
  - `jarvis_boss_bridge`
- `asolaria-friend-rayss` is NOT present in the live airlock policy.
- The live global sender-token map does NOT include `rayss-codex`, `gaia`, or `liris`.
- `codex-bridge\agents-registry.json` is still anchored on room `asolaria_bridge` and only allowlists `asolaria`, `vector`, `rook`, `forge`, `falcon`, and `watchdog`.
- `codex-bridge\data\` persists only `asolaria_bridge.json` and `jarvis_boss_bridge.json`. There is no persisted `asolaria-friend-rayss` room file.
- The Rayssa friend pack exists under `reports\friend-codex-bridge-packs\20260318-004427-rayssa\`, but it appears to be staged pack material, not merged live runtime config.
- The friend profile says `requireRoomPolicy=true`, but that key was not found in the scanned `colony-agent-bot.js`. From the host side, that enforcement is not code-verified.
- `bridgectl.ps1 -Command status` shows both local relay health and tunnel health failing, while the archived friend-pack bridge URL and the current tunnel-url file point to different quick-tunnel domains.
- The current QDD smoke instruction still tells `Liris` to post results to `http://192.168.1.3:4799/msg`, but nothing is listening on `4799`.

## Meaning

The Rayssa path on this host is not a live registered bridge lane right now.

It is a mix of:

- older `asolaria_bridge` bootstrap memory for `@liris`
- a prepared but unmerged friend bridge pack for `rayss-codex`
- a dead `4799` return path still referenced in QDD instructions
- WhatsApp/manual relay as the practical fallback

## Next Decision

Pick one real return lane for QDD and make the packet match reality:

1. merge `asolaria-friend-rayss` into the live airlock policy + sender-token map and bring the relay back
2. restore a deliberate `@liris` path on `asolaria_bridge`
3. keep WhatsApp/manual relay and remove the dead `4799` instruction from the smoke packet

Until that decision is made, the temporary external-node preservation order from Jesse should remain in force.
