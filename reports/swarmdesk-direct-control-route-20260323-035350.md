# SwarmDesk Direct Control Route

Date: 2026-03-23 03:53 -03:00
Owner: Jesse
Scope: fastest path to real pre-simulation orchestration without screenshot/GPU waste

## Current Live Truth

- Asolaria is live on PID `19340` and listening on `0.0.0.0:4781`
- `GET /api/health/fast` is healthy
- `GET /api/mobile/bootstrap` is healthy
- Jesse phone ADB path is live at `192.168.15.188:5555`
- local bridge colony lanes are still mostly offline (`Vector`, `Rook`, `Forge`, `Falcon` not running as live lanes)

This means the sovereign runtime exists, but the expensive multi-lane colony is not the best immediate path for speed.

## Main Finding

We do not need to reverse-engineer Madness Interactive from screenshots or image parsing.

Dan's local SwarmDesk source already exists at:

- `C:\Users\acer\swarmdesk-src\swarmdesk-dashboard-hooks.js`

That file exposes the real control surfaces directly:

- authenticated AI config fetch: `/api/ai-provider-keys`
- authenticated chat completion: `/api/ai/chat-completion`
- authenticated MCP tool bridge: `/api/mcp`
- tool invocation format: `omnispindle__<function>`
- tool vocabulary in the hook prompt:
  - `add_todo`
  - `list_todos`
  - `search_todos`
  - `complete_todo`
  - `get_user_stats`
  - `list_projects`
  - `add_lesson`

The same hook file also points at Asolaria's browser MQTT feed:

- `http://127.0.0.1:4781/api/integrations/mqtt/browser-feed`

So the fastest route is a direct task/data adapter, not screen scraping.

## Authority Correction

- The visual shell is not the source of truth; Asolaria is
- `real Falcon` is still only valid when spawned and ordered by the live Asolaria supervisor path
- direct phone control or Termux execution is a phone surface, not a real Falcon spawn
- `fake Helm` can still be useful as the temporary prep/operator layer before the full simulation starts

## Skill / Tool Note

Requested skill name: `claude code webbrowser extension`

Local truth:

- no local skill with that exact name was found
- the valid fallback skill is `playwright`
- in this case, local source inspection beat browser/UI scraping on speed and certainty

## Best Route Right Now

1. Keep Asolaria PID `19340` as the sovereign router on `4781`
2. Use SwarmDesk / Madness Interactive as the low-cost task manager control plane
3. Integrate against the real task/data surfaces from local source and authenticated network calls
4. Keep `fake Helm` as the bounded prep/operator layer while the live colony remains mostly offline
5. Bring `real Falcon` in only after Asolaria deliberately spawns and orders it
6. Use Jesse's phone for edge assist and transport support, not as the first orchestration surface

## Immediate Next Move

Build a thin SwarmDesk adapter in Asolaria around the already-revealed contract:

- auth token acquisition from the logged-in session path
- authenticated `/api/mcp` tool invocation
- optional `/api/ai/chat-completion` relay only if needed
- task/result sync into Asolaria memory/index without copying Dan's full tool stack blindly

This is the cheapest real path to "super fast" without burning processors on image automation.
