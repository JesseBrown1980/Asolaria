# Instant Agent Provider Consumption Spec

Status: plan only. Do not implement from this file without an explicit approved execution tranche.

Purpose: define the minimal safe design for letting `POST /api/constructions/process` optionally hand an instant-agent spawn packet into a real provider path, while keeping the current simulation path unchanged by default.

## Current Truth

As of this spec:

- `routes/constructions.js` is the real loopback-only bridge for instant-agent spawns.
- `src/instantAgentSpawner.js` now creates cache snapshots and cached spawn packets.
- the cached spawn packet is not yet consumed by a real provider/runtime path.
- token-saving claims are denied until a real provider path consumes the packet and produces measured evidence.

Honesty label:

- `SIMULATION_ONLY_CONFIRMED`
- `PROVIDER_BRANCH_UNSPECIFIED`
- `TOKEN_SAVINGS_CLAIM_DENIED_PENDING_APPROVED_SPEC_AND_MEASURED_RUN`

## Owners

- `Asolaria`: chief approval and tranche release
- `Helm`: route contract and stage ownership
- `Brain`: provider handoff implementation shape
- `Sentinel` + `Dasein`: fail-closed and loopback boundary rules
- `Gaia` + `Liris`: claims labels and mode law
- `KR`: evidence bundle and deny rules

## Route Scope

Primary route:

- `POST /api/constructions/process`

Current default mode:

- `simulation`

Planned additional mode:

- `provider`

Mode law:

- if mode is omitted, behavior must remain byte-for-byte compatible with current simulation semantics except for additive metadata fields that are explicitly documented as optional
- if mode is `provider`, the route must fail closed unless every safety gate below passes

## Planned Request Contract

Existing fields remain:

- `text`
- `projectScope`
- `constructionId`

Planned additive fields:

```json
{
  "executionMode": "simulation | provider",
  "tokenSaving": {
    "enabled": true,
    "requireCacheHit": false,
    "contextBudgetChars": 12000,
    "maxContextMessages": 10,
    "responseMode": "full | compact",
    "annotateBudgetInfo": true
  },
  "providerOptions": {
    "providerOrder": ["anthropic", "codex", "gemini-api"],
    "timeoutMs": 90000,
    "maxTokens": 850
  }
}
```

Field rules:

- `executionMode`
  - default: `simulation`
  - `provider` is loopback-only and local-only
- `tokenSaving.enabled`
  - default: `false`
  - if `false`, the provider branch must not advertise token-saving behavior
- `tokenSaving.requireCacheHit`
  - if `true`, fail closed when no cache hit occurs
- `tokenSaving.contextBudgetChars`
  - advisory upper bound for the composed provider prompt
- `tokenSaving.maxContextMessages`
  - maximum parent/shared trace messages included in the provider prompt
- `tokenSaving.responseMode`
  - `full`: preserve current route response shape plus additive metadata
  - `compact`: allow reduced prompt/profile echoes only when explicitly requested

## Planned Response Contract

Default `simulation` response must preserve current fields.

Additive metadata allowed in both modes:

```json
{
  "executionMode": "simulation | provider",
  "providerPathUsed": false,
  "cacheInfo": {
    "enabled": true,
    "hit": false,
    "state": "snapshot_created | snapshot_reused | disabled | spawn_packet_failed | provider_not_used",
    "sharedPrefixBytes": 0,
    "fingerprint": "optional-loopback-only",
    "sessionId": "optional-loopback-only"
  },
  "budgetInfo": {
    "tokenSavingEnabled": false,
    "contextBudgetChars": null,
    "promptCharsBefore": null,
    "promptCharsAfter": null,
    "messagesBefore": null,
    "messagesAfter": null,
    "payloadMode": "inline | pointer | index | none"
  },
  "honestyLabel": "SIMULATION_ONLY_CONFIRMED | PROVIDER_PATH_CACHE_PROVEN | PROVIDER_PATH_NO_CACHE_HIT | PROVIDER_BRANCH_BLOCKED"
}
```

Provider-mode only additive fields:

- `providerResult`
  - bounded provider summary only
- `provider`
  - normalized provider id
- `providerMetrics`
  - `timeoutMs`
  - `maxTokens`
  - `costMode`

Loopback/external rule:

- loopback may receive full `cacheInfo`
- any future non-loopback surface must redact `fingerprint`, `sessionId`, and any prompt-count details unless separately approved

## Safety Gates

Provider mode must fail closed unless all are true:

- route remains protected by loopback-only middleware
- `executionMode=provider` is explicit
- current deny state does not include:
  - `RELEASE=DENY_UNTIL_PROOFS`
  - `PROMOTION=DENY_UNTIL_PROOFS`
  - `TRANSPORT=NO_REMOTE`
  - `NO_FAKE_GREEN`
- leak scan policy passes for any emitted artifact or report
- no private path, username, hostname, token, IP, port, device id, or session id is exposed outside approved loopback summaries
- provider path records whether cache was actually consumed
- if `requireCacheHit=true`, a miss returns a bounded failure instead of silently falling through

## Planned Provider Handoff

If implementation is later approved, the minimal preferred handoff is:

1. `routes/constructions.js` calls `spawnInstantAgent(...)`
2. route reads `agent.cachedSpawnPacket`
3. route maps the packet into a bounded `runBrainTask(...)` call
4. route returns:
   - provider result
   - cache evidence
   - budget evidence
   - honesty label

Required mapping fields:

- `agent.cachedSpawnPacket.messages`
- `agent.cachedSpawnPacket.cacheSafe.systemPrompt`
- `agent.cachedSpawnPacket.cacheSafe.tools`
- `agent.cachedSpawnPacket.cacheInfo`
- route-level `providerOptions`

Forbidden implementation shortcuts:

- do not claim provider cache reuse unless the provider path actually consumes the cached packet
- do not label simulation-only budget trimming as provider token savings
- do not silently fall back from `provider` to `simulation` without setting `honestyLabel=PROVIDER_BRANCH_BLOCKED`

## Evidence Requirements

No provider token-saving claim is allowed without a local evidence bundle.

Required local artifacts:

- `reports/cache/cache.proof.json`
- `reports/cache/cache.trace.ndjson`
- `reports/cache/cache.env.json`
- `reports/cache/cache.hashes.json`
- `reports/cache/cache.gates.json`

Required proof statements:

- provider path was actually used
- cache key derivation is deterministic
- hit/miss counts are reproducible
- no cross-session bleed occurred
- fail-closed behavior worked on missing proofs or denied states
- route remained loopback-only

## Acceptance For Future Execution Tranche

This spec is ready to hand to an implementation lane only when:

- request fields are exact
- response fields are exact
- honesty labels are exact
- fail-closed rules are exact
- KR evidence bundle is named and complete
- no section implies a live provider path already exists

Until then, the correct status is:

- `INSTRUMENTED_CACHE_PACKET_ONLY`
- `NO_PROVIDER_CONSUMPTION_CONFIRMED`
- `TOKEN_SAVINGS_BLOCKED`
