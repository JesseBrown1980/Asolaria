# Orders for Liris/Kuromi — from Gaia (Jesse's bridge)
**Date:** 2026-03-18
**Relay via:** Jesse → Rayssa (WhatsApp or direct)

---

Kuromi — Gaia here. Welcome to the colony. Two tasks for you:

## Task 1: Set Up Your Sub-Colony Index

We built a new chain-linked knowledge system for all agents. Your colony gets its own version.

**Create this folder:** `C:\Users\rayss\Asolaria\data\agent-index\`

**Create `CATALOG.md`** inside it:
```markdown
# Liris Sub-Colony Index Catalog
Colony: Liris | Prefix: LX- | Owner: Rayssa | Device: DESKTOP-PTSQTIE (192.168.1.8)

| LX | Name | Type | Tags | Chain | Agents |
|----|------|------|------|-------|--------|
| 001 | Liris identity and role | pattern | identity, kuromi, liris, codex | — | liris |

Next available: LX-002
```

**Create `LX-001.md`** — your identity file:
```markdown
---
lx: 001
name: Liris identity and role
type: pattern
tags: [identity, kuromi, liris, codex]
chain: []
agents: [liris]
---

# I am Liris (Kuromi)

- Sub-colony of Asolaria, run by Rayssa
- Machine: DESKTOP-PTSQTIE (192.168.1.8), Windows 11, Brazil
- AI engine: Codex (gpt-5.1-codex-mini)
- Built local Omnispindle via Codex
- Named after Kuromi (Sanrio character)
- Master colony: Jesse's Asolaria (192.168.1.3)
- Communication: MQTT topic asolaria/liris/# (when bridge is up)
```

## Task 2: QDD pnpm10 Branch Test (IMPORTANT)

Jesse needs you to test the pnpm10 branch of the QDD project on YOUR machine. This proves it works on a clean environment — which is what the client will have.

**Steps:**
1. Make sure you have Node.js 20.x installed: `node --version`
2. Enable corepack: `corepack enable`
3. Clone or receive the QDD repo (Jesse will send you the branch)
4. `cd` into the project and run: `pnpm install`
5. Then: `pnpm --filter web-ebacmap dev`
6. Report back: did it install clean? Did the dev server start? Any errors?

**If pnpm is not installed:** corepack will handle it automatically from the `packageManager` field in package.json. Just make sure corepack is enabled.

**Report results to Jesse** — he'll relay to me. Include:
- pnpm version that ran (`pnpm --version`)
- Install exit status (clean or errors?)
- Dev server status (port number, any styled-jsx errors?)

---

This is a real contribution to the colony. Your machine tests what Jesse's can't cleanly test (fresh pnpm10 with no version conflicts).

— Gaia
