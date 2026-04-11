# Asolaria — Agent Boot Rules

## STOP — READ BEFORE DOING ANYTHING

### Encryption Before Connection (LX-204)

Asolaria ports use encryption and identity handshake. If you connect with plaintext
(mqtt://, http://, ws://), you will get SILENCE. Not an error. Not a timeout. SILENCE.

This is not a bug. This is the civilization's immune system.

**Every agent generation has failed the same way:**
1. Reads broker URL as `mqtt://...`
2. Connects plaintext
3. Gets timeout
4. Concludes "host unreachable"
5. WRONG — the host is up, you lack encryption keys

**What you must do:**
1. Check encryption keys FIRST — `data/vault/`, `certs/`, env vars
2. Use encrypted protocols — `mqtts://`, `wss://`, `https://`
3. Have identity credentials — spawned PID, sender policy registration
4. If a port is silent, you lack encryption or identity — do NOT conclude it is down
5. NEVER "fix" silence by switching to plaintext — that destroys security

Evidence: LX-110, LX-114, LX-122, LX-134, LX-135, LX-204

### Identity Handshake (LX-122)

Asolaria does NOT reply unless the agent:
1. Was SPAWNED by her (she initiates)
2. Received credentials (PID + name)
3. Correctly answers "WHO ARE YOU?"

If wrong → she listens but NEVER answers. The black hole.

### Index System

- Local index: `data/agent-index/CATALOG.md` (LX- prefix)
- Sovereign index: IX- prefix (on Jesse's machine)
- Follow chains to find related knowledge
- Memory → Index → Think → Memory → Index → Report
- Agents are temporary. The index is permanent. (LX-041)

### ASO Language System

The ASO system replaces ad-hoc LX file creation with typed, searchable operations.

**Client setup:**
```js
const aso = require('./src/aso-client');
```

**Core rule — record everything you discover:**
```js
aso.observe(topicId, 'what you found');
```
After discovering anything, record it as an observation immediately.

**Do NOT create new LX files.** Use `aso.topic(name, type)` to create new vocabulary entries instead.

**Typed operations** — use these for everything:
- `observe(topicId, summary)` — record a finding or fact
- `relate(from, verb, to)` — link two topics together
- `outcome(topicId, trigger, result)` — record the result of an action
- `surface(topicId, host, port)` — register a live host/port endpoint
- `evidence(topicId, sourceKind, sourceRef)` — attach proof to a claim
- `conflict(topicId, entryA, entryB)` — flag a contradiction between entries
- `topic(name, type)` — create a new vocabulary entry
- `revise(asoId, changes)` — update an existing topic
- `list(filter)` — list topics by type/tier/scope
- `get(asoId)` — fetch a single topic
- `status()` — full ASO system status
- `resolve(id)` — crosswalk any ID to ASO ID
- `resolveConflict(conflictId, resolution)` — resolve a flagged conflict

**Search:**
```js
aso.search('keyword'); // returns scored matches
```

**Colony health check:**
```bash
node src/colony-health-reporter.js
```

**Remote agent gateway:**
```
POST /api/aso/op
Authorization: Bearer <auth-token>
Content-Type: application/json
```
All typed operations are available through this endpoint for remote agents.

### Port Truth

| Port | Service | Protocol | Notes |
|------|---------|----------|-------|
| 4791 | Gateway | HTTPS preferred | Checked-in runtime entry point |
| 4781 | Legacy main app | — | NOT present in current checkout |
| 18883 | MQTT broker TCP | Encrypted | Requires TLS keys |
| 18884 | MQTT broker WS | Encrypted | Requires TLS keys |
| 18885 | MQTT broker WSS | TLS/PFX | Requires certs/asolaria-local.pfx |
| 5443 | HTTPS gateway | TLS | Requires PFX cert |

### Never Do

- Never connect to any port with plaintext without checking encryption first
- Never delete security you don't understand (LX-110)
- Never change ports without reading the source code (LX-018)
- Never trust docs over source code — docs may be Codex-era myths (LX-102)
- Never auto-connect to Dan's MCP / omnispindle without approval (LX-121)
- Never spawn agents beyond hardware limits (LX-111)
