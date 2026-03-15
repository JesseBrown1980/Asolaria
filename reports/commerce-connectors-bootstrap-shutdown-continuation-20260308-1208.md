# Commerce Connector Bootstrap Packet

Prepared: 2026-03-10
Scope: bootstrap plan for commerce connectors in Asolaria with read-first integrations, explicit approval gates for writes, and auditable execution.

## Guardrails

- No secrets in code, reports, logs, fixtures, or test artifacts.
- No sensitive environment topology, internal hostnames, or private network details in connector docs or telemetry.
- MVP is read-first. Any mutation path is disabled by default and requires explicit risk scoring plus guardian approval.
- Auditability is a hard requirement: every connector action should produce a manifestable request/response summary without storing raw credentials.

## 1) MVP Connector Order

### Recommended rollout order

1. Shopify
2. Meta Commerce
3. TikTok Shop
4. Amazon SP-API

### Why this order

#### Shopify first

- Fastest path to usable value: mature OAuth flow, stable product and order APIs, and a common merchant starting point.
- Lowest integration ambiguity for MVP: one platform can validate the connector contract, vault handling, risk gates, audit logs, and UI affordances.
- Strongest bootstrap reference: later connectors can reuse the same auth, sync, pagination, idempotency, and approval patterns.

#### Meta Commerce second

- Strong catalog and order-adjacent value after Shopify.
- Good second connector for testing multi-account discovery, catalog scoping, and richer permission negotiation.
- More operational complexity than Shopify, but still better as a second-wave integration than Amazon.

#### TikTok Shop third

- Commercially relevant, but API surface and regional/account nuances make it better after the contract is proven twice.
- Good candidate to validate connector-specific policy overlays without changing the core connector runtime.

#### Amazon last in MVP sequence

- Highest compliance and operational overhead relative to immediate bootstrap value.
- Best handled after the read-first platform contract, audit model, and approval machinery are already stable.

### Effort sizing by connector

- Shopify MVP: 5-7 engineering days
- Meta Commerce MVP: 4-6 engineering days after Shopify patterns exist
- TikTok Shop MVP: 4-6 engineering days after Meta
- Amazon SP-API MVP: 6-9 engineering days after the first three

## 2) Minimal Connector Contract

The contract should be platform-neutral and intentionally small. A connector is "MVP complete" when it supports the capabilities below with consistent telemetry, vault usage, and safety behavior.

### Required capabilities

| Capability | Minimum behavior |
| --- | --- |
| `auth.start` | Start provider auth without exposing tokens in logs or UI. |
| `auth.finish` | Exchange/validate auth material and store only in `secureVault`. |
| `account.list` | Discover accessible shops/accounts/catalogs with stable external IDs. |
| `product.list` | Read products with pagination, cursor persistence, and normalized fields. |
| `product.get` | Read one product by platform ID. |
| `order.list` | Read orders with filters for time window, status, and pagination. |
| `order.get` | Read one order by platform ID. |
| `write.preview` | Build a redacted mutation preview and risk assessment without sending it. |
| `write.execute` | Execute only approved, explicitly allowed mutations. Disabled by default. |
| `audit.record` | Emit manifest + graph event + connector audit row for every read/write request. |
| `health.check` | Validate auth freshness, required scopes, and provider reachability without mutating data. |

### Normalized connector shape

```js
{
  key: "shopify",
  displayName: "Shopify",
  actions: {
    "auth.start": async (input, ctx) => {},
    "auth.finish": async (input, ctx) => {},
    "account.list": async (input, ctx) => {},
    "product.list": async (input, ctx) => {},
    "product.get": async (input, ctx) => {},
    "order.list": async (input, ctx) => {},
    "order.get": async (input, ctx) => {},
    "write.preview": async (input, ctx) => {},
    "write.execute": async (input, ctx) => {},
    "health.check": async (input, ctx) => {}
  }
}
```

### Shared input contract

- `connectionId`: Asolaria-owned logical connection key.
- `accountId`: provider account/shop/catalog identifier.
- `cursor`: opaque pagination state.
- `timeRange`: bounded read window for incremental sync.
- `actor`: caller identity for audit.
- `dryRun`: defaults to `true` for mutation-shaped requests.
- `approvalId`: required for any live mutation.

### Shared output contract

- `ok`: boolean
- `provider`: stable provider key
- `account`: redacted account summary
- `data`: normalized payload
- `cursor`: next page cursor when present
- `audit`: audit event identifiers only
- `risk`: evaluated risk summary for the action
- `warnings`: non-fatal issues such as missing optional fields or partial permissions

### Safe write gates

Writes should stay narrow in the MVP. Do not enable broad catalog mutation early.

Allowed MVP write classes:

- inventory adjustment preview
- order note/tag preview
- product publish/unpublish preview

Execution requirements:

- connector action classified as mutation in provider metadata
- `write.preview` run first and hash stored
- risk level evaluated through `riskEngine`
- guardian approval persisted through `guardianApprovalStore`
- idempotency key attached to provider request where supported
- audit manifest appended before and after execution
- rollback note recorded if the provider supports reversal; otherwise mark as irreversible

### Audit log requirements

Every connector action should record:

- actor
- provider
- action
- account scope
- request fingerprint
- redacted request preview
- response summary
- approval state
- risk level
- started/finished timestamps
- correlation IDs for retries and downstream jobs

Recommended storage hooks in existing Asolaria runtime:

- `src/graphRuntimeStore.js` for graph events and action manifests
- `src/taskLedgerStore.js` for sync task lifecycle and retry events
- a new connector-specific audit store for queryable history

### Risk controls

- Read actions default to `low` or `medium` unless the request scope is unusually broad.
- Any cross-account read or bulk export escalates to `high`.
- All mutations start at `high` or above.
- Secrets remain in `secureVault`; responses and logs use redaction helpers similar to gateway preview redaction.
- Approval TTLs should be short and single-use.
- Connector allowlists should define permitted actions per provider rather than generic mutation access.

## 3) Suggested Module/File Skeleton In Asolaria Repo

The repo already has flat connector entry points plus shared stores and gateway authority. The cleanest path is to add a commerce-specific shared layer under `src/connectors/commerce` while keeping provider entry points discoverable beside the existing connectors.

### Suggested files

```text
src/
  connectors/
    commerceConnector.js
    shopifyConnector.js
    metaCommerceConnector.js
    tiktokShopConnector.js
    amazonSpApiConnector.js
    commerce/
      connectorContract.js
      connectorRegistry.js
      commerceAuditStore.js
      commerceRateLimiter.js
      commerceRiskPolicy.js
      commerceRedaction.js
      commerceCursorStore.js
      commerceSyncPlanner.js
      adapters/
        shopifyAdapter.js
        metaAdapter.js
        tiktokAdapter.js
        amazonAdapter.js
      schemas/
        product.schema.json
        order.schema.json
        account.schema.json
      transforms/
        normalizeProduct.js
        normalizeOrder.js
        normalizeAccount.js
      writes/
        mutationPreview.js
        mutationPolicy.js
        idempotency.js
  gateway/
    toolAuthority.js
  secureVault.js
  riskEngine.js
  guardianApprovalStore.js
  graphRuntimeStore.js
  taskLedgerStore.js
tests/
  unit/
    commerce/
      connectorContract.test.js
      commerceRiskPolicy.test.js
      commerceRedaction.test.js
      normalizeProduct.test.js
      normalizeOrder.test.js
      mutationPreview.test.js
      shopifyConnector.test.js
      metaCommerceConnector.test.js
  integration/
    commerce/
      shopify.reads.test.js
      shopify.write-gates.test.js
      meta.reads.test.js
      provider-error-handling.test.js
  safety/
    commerce/
      approval-required.test.js
      secret-redaction.test.js
      audit-log-completeness.test.js
      cross-account-scope-block.test.js
```

### Purpose of the main files

- `src/connectors/commerceConnector.js`: common entry point for generic commerce actions and provider dispatch.
- `src/connectors/shopifyConnector.js`: first real provider implementation; reference pattern for later providers.
- `src/connectors/commerce/connectorContract.js`: validates action names, input/output envelopes, and action metadata.
- `src/connectors/commerce/connectorRegistry.js`: maps provider keys to implementations and exposes capability discovery.
- `src/connectors/commerce/commerceAuditStore.js`: append-only connector audit records, separate from graph manifests.
- `src/connectors/commerce/commerceRiskPolicy.js`: provider-aware risk overlays on top of `src/riskEngine.js`.
- `src/connectors/commerce/commerceRedaction.js`: strips tokens, auth codes, store identifiers that should not leave the vault boundary, and any provider-specific secret fields.
- `src/connectors/commerce/commerceCursorStore.js`: persists incremental sync cursors and replay-safe checkpoints.
- `src/connectors/commerce/commerceSyncPlanner.js`: creates bounded sync tasks and emits them into task/worker flows.
- `src/connectors/commerce/writes/mutationPolicy.js`: allowlist for live writes and approval prerequisites.

### Required touch points in existing files

- `src/gateway/toolAuthority.js`
  - register provider actions such as `commerce.accounts`, `commerce.products`, `commerce.orders`, `commerce.writePreview`, `commerce.writeExecute`
  - reuse approval-required status and manifest emission patterns already present in gateway tools
- `src/secureVault.js`
  - add secret naming conventions for commerce provider credentials
- `src/riskEngine.js`
  - add baseline action scoring for commerce reads, exports, and mutations
- `src/guardianApprovalStore.js`
  - reuse for single-use mutation approvals
- `src/graphRuntimeStore.js`
  - emit connector graph events and action manifests
- `src/taskLedgerStore.js`
  - track sync plans, retries, backfills, and partial failures

## 4) Test Matrix

### Unit tests

| Area | Checks |
| --- | --- |
| Contract validation | accepts supported actions, rejects missing required fields, rejects unknown provider capabilities |
| Redaction | strips tokens, auth codes, cookies, provider secrets, and oversized previews |
| Normalization | provider payloads normalize to stable product/order/account shapes |
| Risk policy | read vs bulk read vs mutation gets expected risk levels |
| Mutation preview | preview hashes are stable and approval-bound |
| Cursor logic | pagination tokens persist safely and recover after partial failures |
| Idempotency | duplicate execute requests resolve to one provider-side action |

### Integration tests

| Area | Checks |
| --- | --- |
| Shopify auth path | start/finish auth with vault persistence and no secret leakage |
| Shopify account discovery | discovers one or more shops/accounts and normalizes identifiers |
| Shopify product reads | list/get with pagination and rate-limit backoff |
| Shopify order reads | bounded time-range sync with partial page retry |
| Gateway wiring | commerce actions are routable through `toolAuthority` |
| Audit logging | each request writes graph/manifests plus connector audit row |
| Failure handling | provider 4xx/5xx responses map to safe, non-secret-bearing errors |

### Safety checks

| Area | Checks |
| --- | --- |
| Approval enforcement | live mutation without `approvalId` is rejected |
| Single-use approval | reused or expired approval is rejected |
| Dry-run default | mutation-shaped actions remain preview-only unless explicitly executed |
| Cross-account protection | request cannot execute against an unapproved account scope |
| Secret containment | no token or auth code appears in logs, graph events, task ledger, or test snapshots |
| Blast-radius limits | bulk mutation requests above configured thresholds are blocked |
| Irreversible action handling | irreversible actions require elevated risk and explicit messaging |

### Minimum release gate for Shopify MVP

- 100% pass on unit tests for contract, redaction, normalization, mutation preview
- passing integration coverage for auth, account discovery, product reads, order reads, and audit emission
- passing safety tests for approval enforcement, dry-run default, secret containment, and cross-account protection
- manual smoke test with a development shop using non-production data only

## 5) Two-Week Execution Plan

### Week 1

#### Day 1

- finalize connector contract
- define normalized schemas for account, product, order
- add commerce action baselines to risk scoring

Deliverable:

- approved contract doc and empty module scaffolding

#### Day 2

- build connector registry, redaction helpers, audit store, cursor store
- add gateway action routing stubs

Deliverable:

- framework ready for provider implementation

#### Day 3

- implement Shopify auth start/finish
- store credentials in vault
- add health check and account discovery

Deliverable:

- Shopify connection establishment working in development

#### Day 4

- implement Shopify product list/get normalization
- implement cursor persistence and retry-safe reads

Deliverable:

- product sync path working end to end

#### Day 5

- implement Shopify order list/get normalization
- emit audit events and task ledger entries
- add unit tests and first integration tests

Deliverable:

- read-only Shopify MVP complete

### Week 2

#### Day 6

- implement mutation preview framework
- connect to guardian approval and risk policy

Deliverable:

- preview-only write gating complete

#### Day 7

- implement one narrow Shopify write path behind approvals
- add idempotency and irreversible-action labeling

Deliverable:

- safe write execution path complete for one approved mutation class

#### Day 8

- harden error handling, rate limits, timeout behavior, and retry rules
- complete safety and redaction tests

Deliverable:

- Shopify release gate candidate

#### Day 9

- start Meta Commerce adapter using the shared contract
- implement auth/account discovery first

Deliverable:

- second provider skeleton validated against the same runtime

#### Day 10

- finish Meta product/order reads or, if provider setup blocks, complete TikTok/Amazon adapters as contract-only stubs
- publish bootstrap review and backlog for next sprint

Deliverable:

- second-wave provider ready to continue without redesign

## Recommended backlog after the two-week sprint

- Meta product/order parity
- TikTok Shop adapter
- Amazon SP-API adapter
- connector admin UI for connection status and approval history
- scheduled sync orchestration and backfill controls
- provider-specific observability dashboards built on existing runtime manifests

## Staffing and effort summary

- Bootstrap packet effort: small, 0.5 day
- Shopify MVP implementation: medium, 5-7 days
- Shared commerce runtime foundation: medium, 3-4 days
- Second provider bootstrap after Shopify: medium, 4-6 days
- Full first-wave set through Amazon: large, roughly 19-28 engineering days total

## Exit Criteria

The bootstrap is successful when Asolaria can:

- connect to Shopify without leaking credentials
- discover accounts and read products/orders through a normalized contract
- preview a narrow write safely and block execution unless approval is present
- emit auditable manifests and task events for every connector action
- add Meta, TikTok Shop, and Amazon without redesigning the shared contract
