# Indexed Memory Retrieval Implementation

- Generated: `2026-03-22 22:55 -03:00`
- Objective: turn `IX-238` from theory into a real runtime retrieval path

## What Changed

- Added `src/agentIndexStore.js`
  - loads `data/agent-index/CATALOG.md`
  - loads individual `IX-*.md` files
  - exposes status, search, prompt-context, and semantic-document collection
- Extended `server.js`
  - hybrid workspace-knowledge status now reports `agentIndex`
  - hybrid workspace-knowledge search now merges `index` matches
  - shared prompt memory now includes `Agent index:` context
- Extended `src/semanticKnowledgeStore.js`
  - semantic documents now include `agent_index` sources, not just notebook/chat/workspace
- Extended `routes/workspaceKnowledge.js`
  - added `GET /api/workspace-knowledge/index/status`
  - added `GET /api/workspace-knowledge/index/search?q=...`
- Extended `src/intentRouter.js`
  - explicit `agent index` and `index language` status/search phrases now route into workspace knowledge
- Added runtime contract:
  - `tests/contracts/workspace-knowledge-indexed.test.js`

## Verification

- Module sanity:
  - direct `agentIndexStore.searchAgentIndex("IX-238 memory index")` returns `IX-238` as the top match
  - semantic document collection now includes `agent_index` documents
- Runtime contract:
  - verified on a one-shot sidecar runtime at `http://127.0.0.1:57481`
  - `ASOLARIA_HTTPS_ENABLE=false`
  - `ASOLARIA_STARTUP_AUTORUN=false`
  - contract result: `4` checks passed, `0` failed
- Verified endpoints:
  - `/api/workspace-knowledge/status`
  - `/api/workspace-knowledge/index/status`
  - `/api/workspace-knowledge/index/search?q=IX-238%20memory`
  - `/api/workspace-knowledge/search?q=IX-238%20memory`

## Important Caveat

- The primary listener on `4781` is protected by PID `376`.
- Standard restart failed with access denied while trying to replace that listener.
- So this slice is implemented and verified, but it is not yet loaded into the protected main runtime on `4781`.
- Next operational move is an owner-controlled restart of the primary listener.

## Why This Matters

- `IX` language is now retrievable through the same workspace-knowledge spine the runtime already uses.
- That means indexed memory is part of prompt context and API search, not just a pile of markdown files on disk.
