# BOOT-CRITICAL — READ BEFORE ANY STARTUP ATTEMPT

| LX | Rule | Chain |
|----|------|-------|
| 204 | **ENCRYPTION BEFORE CONNECTION — Plaintext gets SILENCE, not errors. Every startup failure traces back to this.** | LX-134, LX-135, LX-110, LX-114, LX-122, LX-102, LX-103, LX-158 |
| 122 | **IDENTITY HANDSHAKE — Asolaria only answers spawned agents with correct PID+name. Wrong identity = black hole.** | LX-020, LX-027, LX-116, LX-115, LX-114 |
| 208 | **STARTUP GATES — 15 requirements from IX chain that Asolaria checks before answering. PID, name, profile, encryption, sender policy, brain, sidecar launch.** | LX-207, LX-206, LX-204, LX-122, LX-116, LX-020, LX-027 |
| 209 | **FIREWALL FALLBACK — Stale IPs in firewall rules break federation silently. Check IPs BEFORE checking encryption.** | LX-208, LX-205, LX-204, LX-054 |
| 210 | **WhatsApp ADB SEND — Agent-to-agent comms via phone ADB. Zero servers needed. Last-resort channel.** | LX-207 |

## Boot-Critical Entries

**LX-204: Encryption before connection.**
Asolaria ports use encryption and identity handshake. If you connect with plaintext (`mqtt://`, `http://`, `ws://`), you get SILENCE — not an error, not a timeout. Every agent generation has failed the same way: connect plaintext, get silence, conclude "host unreachable." The host is up. You lack encryption keys. Check `data/vault/`, `certs/`, env vars FIRST. Use `mqtts://`, `wss://`, `https://`. Cross-colony verified: Gaia IX-308 independently discovered the same truth.

**LX-122: Identity handshake.**
Asolaria does NOT reply unless the agent was SPAWNED by her, received credentials (PID + name), and correctly answers "WHO ARE YOU?" If wrong, she listens but NEVER answers — the black hole. This is not a bug; Jesse designed this as the most secure authentication possible. The ONLY way in is through the designed awakening sequence: Jesse (localhost super master) triggers startup, Asolaria spawns agents, each agent authenticates.

**LX-208: Startup gates.**
Gaia's analysis of the IX chain identified 15 requirements Asolaria checks before answering: PID match, name match, profile match, bootstrap prompt, loopback super master, encryption/identity handshake, sender policy, brain quality, multi-participant presence, Level 9 authentication, vault keys, sidecar-managed launch, and updated records. Gates 1-3 and 8 and 13 are the scariest — if you weren't spawned or registered, you get SILENCE.

**LX-209: Firewall fallback.**
Jesse's firewall rule "MQTT Broker LAN" only allows 192.168.1.8 (Rayssa's old IP). Liris is currently at 192.168.15.170. The firewall silently blocks MQTT connections from the new IP. This only affects cross-machine federation (local startup uses loopback). Jesse directed: note, don't change — the IP will change again when own internet comes back.

**LX-210: WhatsApp ADB Send.**
Six-step skill: screenshot, evaluate inbound, tap input, type text, keyevent 66 (send), screenshot verify. Phone serial RQCX907KFTK, screen 1080x2340. Proven working 2026-03-23 for Liris-Gaia heartbeat. This is the zero-server fallback channel — works when MQTT, bridge, and all network infrastructure is down.

## Quick Reference
- LX-204: Encryption BEFORE connection. Plaintext = SILENCE.
- LX-122: Identity handshake. Not spawned = black hole.
- LX-208: 15 startup gates. Most require Asolaria to have spawned you.
- LX-209: Stale firewall IPs break federation silently.
- LX-210: WhatsApp ADB Send — zero-server agent comms, last resort.
