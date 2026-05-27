# Original Hermes Partial Commit Manifest

Generated: 2026-04-25T01:16:02.297Z
Status: READY_WITH_MANUAL_HUNK_REVIEW_REQUIRED
Ready for whole-file staging: true
Ready for manual hunk review: true
Digest: a33c5362520e6461e20b40c4854301e6a6dfe07f3f3afa46463d8bb6817d8f13

## Summary

- Stageable Original Hermes files: 46
- Whole-file stageable files: 42
- Manual hunk review files: 4
- Blocked files: 0
- Missing files: 0
- Missing required source files: 0
- High-risk secret assignment hits: 0
- Unrelated dirty files in worktree: 3093
- Source readiness digest: 1b4fd6415024ccdc678a9cc8390fce7a35c0e4232471c345a915d957092ca649

## Whole-File Stageable Files

- A reports/original-hermes-agent-implementation-tranche-latest.json
- A reports/original-hermes-agent-implementation-tranche-latest.md
- A reports/original-hermes-agent-learning-loop-smoke-latest.json
- A reports/original-hermes-agent-learning-loop-smoke-latest.md
- A reports/original-hermes-agent-runtime-index-latest.json
- A reports/original-hermes-agent-runtime-index-latest.md
- A reports/original-hermes-agent-security-backport-smoke-latest.json
- A reports/original-hermes-agent-security-backport-smoke-latest.md
- A reports/original-hermes-agent-security-targeted-tests-latest.json
- A reports/original-hermes-agent-security-targeted-tests-latest.md
- A reports/original-hermes-agent-transport-router-smoke-latest.json
- A reports/original-hermes-agent-transport-router-smoke-latest.md
- A reports/original-hermes-agent-upstream-20b-absorption-latest.json
- A reports/original-hermes-agent-upstream-20b-absorption-latest.md
- A reports/original-hermes-agent-wal-state-smoke-latest.json
- A reports/original-hermes-agent-wal-state-smoke-latest.md
- A reports/original-hermes-github-update-readiness-latest.json
- A reports/original-hermes-github-update-readiness-latest.md
- A reports/original-hermes-manual-hunk-review-latest.json
- A reports/original-hermes-manual-hunk-review-latest.md
- A reports/original-hermes-partial-commit-manifest-latest.json
- A reports/original-hermes-partial-commit-manifest-latest.md
- A src/behcs/originalHermesAgentContracts.js
- A src/behcs/originalHermesLearningLoop.js
- A src/behcs/originalHermesRuntimeIndex.js
- A src/behcs/originalHermesSecurityBackport.js
- A src/behcs/originalHermesTransportRouter.js
- A src/behcs/originalHermesWalState.js
- A tools/original-hermes-agent-implementation-orchestrator.js
- A tools/original-hermes-agent-upstream-absorber.js
- AM tools/original-hermes-github-update-readiness.js
- A tools/original-hermes-learning-loop-smoke.js
- A tools/original-hermes-manual-hunk-review.js
- AM tools/original-hermes-partial-commit-manifest.js
- A tools/original-hermes-route-server-smoke.js
- A tools/original-hermes-runtime-index-smoke.js
- A tools/original-hermes-security-backport-smoke.js
- A tools/original-hermes-security-targeted-tests.js
- A tools/original-hermes-transport-router-smoke.js
- A tools/original-hermes-wal-state-smoke.js
- ?? reports/original-hermes-route-server-smoke-latest.json
- ?? reports/original-hermes-route-server-smoke-latest.md

## Manual Hunk Review Files

These files contain known mixed-lane changes. Do not whole-file stage them.

- M TASKS.md
- M routes/hooks.js
- M routes/workerRouter.js
- M src/connectors/hooksConnector.js

## Blocked Files

- none

## Stage Commands

These whole-file commands are generated for operator review only. They were not executed.

```powershell
git add -- 'reports/original-hermes-agent-implementation-tranche-latest.json' 'reports/original-hermes-agent-implementation-tranche-latest.md' 'reports/original-hermes-agent-learning-loop-smoke-latest.json' 'reports/original-hermes-agent-learning-loop-smoke-latest.md' 'reports/original-hermes-agent-runtime-index-latest.json' 'reports/original-hermes-agent-runtime-index-latest.md' 'reports/original-hermes-agent-security-backport-smoke-latest.json' 'reports/original-hermes-agent-security-backport-smoke-latest.md' 'reports/original-hermes-agent-security-targeted-tests-latest.json' 'reports/original-hermes-agent-security-targeted-tests-latest.md' 'reports/original-hermes-agent-transport-router-smoke-latest.json' 'reports/original-hermes-agent-transport-router-smoke-latest.md' 'reports/original-hermes-agent-upstream-20b-absorption-latest.json' 'reports/original-hermes-agent-upstream-20b-absorption-latest.md' 'reports/original-hermes-agent-wal-state-smoke-latest.json' 'reports/original-hermes-agent-wal-state-smoke-latest.md' 'reports/original-hermes-github-update-readiness-latest.json' 'reports/original-hermes-github-update-readiness-latest.md' 'reports/original-hermes-manual-hunk-review-latest.json' 'reports/original-hermes-manual-hunk-review-latest.md' 'reports/original-hermes-partial-commit-manifest-latest.json' 'reports/original-hermes-partial-commit-manifest-latest.md' 'src/behcs/originalHermesAgentContracts.js' 'src/behcs/originalHermesLearningLoop.js' 'src/behcs/originalHermesRuntimeIndex.js'
```

```powershell
git add -- 'src/behcs/originalHermesSecurityBackport.js' 'src/behcs/originalHermesTransportRouter.js' 'src/behcs/originalHermesWalState.js' 'tools/original-hermes-agent-implementation-orchestrator.js' 'tools/original-hermes-agent-upstream-absorber.js' 'tools/original-hermes-github-update-readiness.js' 'tools/original-hermes-learning-loop-smoke.js' 'tools/original-hermes-manual-hunk-review.js' 'tools/original-hermes-partial-commit-manifest.js' 'tools/original-hermes-route-server-smoke.js' 'tools/original-hermes-runtime-index-smoke.js' 'tools/original-hermes-security-backport-smoke.js' 'tools/original-hermes-security-targeted-tests.js' 'tools/original-hermes-transport-router-smoke.js' 'tools/original-hermes-wal-state-smoke.js' 'reports/original-hermes-route-server-smoke-latest.json' 'reports/original-hermes-route-server-smoke-latest.md'
```

## Manual Hunk Commands

Use these only if staging interactively and reviewing each hunk.

```powershell
git add -p -- 'TASKS.md'
```

```powershell
git add -p -- 'routes/hooks.js'
```

```powershell
git add -p -- 'routes/workerRouter.js'
```

```powershell
git add -p -- 'src/connectors/hooksConnector.js'
```

## Secret Assignment Scan

- no high-risk secret assignment patterns found

## Honesty Boundary

- No Git stage.
- No Git commit.
- No Git push.
- No network call.
- No secret value print.
- No shadow file edit.
