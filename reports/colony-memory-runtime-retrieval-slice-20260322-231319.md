# Colony Memory Runtime Retrieval Slice

- Generated: `2026-03-22 23:13 -03:00`
- Scope: begin the implementation phase by exposing colony-memory contracts through runtime retrieval surfaces

## What Was Implemented

Added:

- `src/colonyMemoryStore.js`
- `tests/contracts/colony-memory-store.test.js`

Wired into:

- `server.js`
- `routes/workspaceKnowledge.js`
- `src/semanticKnowledgeStore.js`
- `src/intentRouter.js`

## Runtime Surfaces Added

New retrieval surfaces:

- `GET /api/workspace-knowledge/colony-memory/status`
- `GET /api/workspace-knowledge/colony-memory/search`

Extended behavior:

- hybrid workspace-knowledge status now includes `colonyMemory`
- hybrid search can return `kind: "colony_memory"`
- shared prompt context now includes `Colony memory contracts:`
- semantic knowledge collection now includes colony-memory documents
- natural language queries like `colony memory search ...`, `transport epoch search ...`, and `colony registry status` now route into the workspace-knowledge path

## Verification

Syntax:

- `node --check src/colonyMemoryStore.js`
- `node --check src/semanticKnowledgeStore.js`
- `node --check routes/workspaceKnowledge.js`
- `node --check src/intentRouter.js`
- `node --check server.js`

Behavior:

- `node tests/contracts/colony-memory-store.test.js` -> `9` passed, `0` failed
- `node tests/contracts/colony-memory-contract.test.js` -> `27` passed, `0` failed

## Boundary

This retrieval slice is implemented in code, but it has **not** yet been loaded into the protected main listener on `4781`.

So the code is ready, and the store/tests are green, but the new HTTP routes should not be treated as live on the primary runtime until the owner-controlled restart happens.

## Next Move

The remaining implementation phase is narrower now:

1. restart the protected main listener so the new routes and prompt-context integration become live
2. expose the same contracts through MCP resources if needed
3. enforce provenance fields on transport mutation/status write paths
