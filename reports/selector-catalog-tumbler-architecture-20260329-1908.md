# Unified Selector Catalog + Hardware Tumbler

Date: 2026-03-29
Status: active
Scope: Asolaria backend selector architecture for network/work/device/cloud/worker lanes

## Why this exists

The previous Omnispindle-style connection selector was useful, but too narrow.

The system now needs one backend-capable selector catalog that can describe and eventually drive:

- network and Wi-Fi posture
- work identity and hosted-work policy
- device-lab and serial/USB lanes
- remote-control surfaces like AnyDesk or RDP
- messaging surfaces like WhatsApp and Telegram
- cloud surfaces like Google Workspace and GCP
- AI worker/model lanes

It also needs a hardware-capacity governor so multiple agents and models do not oversubscribe the machine.

## Three-agent architecture conclusion

Three architecture passes converged on the same shape:

1. Keep a canonical selector store, not just UI dropdown state.
2. Distinguish `reference` selectors from `control` selectors.
3. Make `profileId` and `accessLevel` first-class metadata.
4. Keep runtime capability resolution derived from the live machine.
5. Add a tumbler scheduler so workers/models must acquire a limited slot before running.

## Implemented source-of-truth

Canonical selector store:

- `data/selector-catalog.json`
- loader: `src/selectorCatalogStore.js`

This store now carries:

- categories
- access levels
- selector profiles
- tumbler profiles
- static selector entries for important surfaces

## Implemented registry

Typed registry:

- `src/selectorCatalogRegistry.js`

This layer merges:

- dynamic connection fixtures from `src/networkFixtureCatalog.js`
- dynamic work-org selectors from policy
- worker-lane selectors
- static selectors from `data/selector-catalog.json`

It also exposes:

- categories
- profiles
- access levels
- resolved selectors
- selector summaries
- dry-run payloads for supported selectors

## Implemented tumbler

Hardware-capacity tumbler:

- `src/modelLaneTumbler.js`
- state file: `data/selector-tumbler-state.json`

Current tumbler profiles:

- `cpu_local_general`
- `gpu_primary_model`
- `browser_remote_surface`
- `device_lab_serial`

The tumbler acts like a revolver with an autoloader:

- each lane/model must acquire a slot
- no more than `maxActive` leases can run at once
- extra work queues instead of oversubscribing hardware
- releasing a slot autoloads the next waiting request
- rotation state is persisted

## Implemented backend API

Backend route:

- `routes/catalog.js`
- mounted at `/api/catalog`

Current endpoints:

- `GET /api/catalog/summary`
- `GET /api/catalog/categories`
- `GET /api/catalog/profiles`
- `GET /api/catalog/access-levels`
- `GET /api/catalog/selectors`
- `GET /api/catalog/selectors/:id`
- `POST /api/catalog/selectors/:id/dry-run`
- `GET /api/catalog/tumblers`
- `POST /api/catalog/tumblers/acquire`
- `POST /api/catalog/tumblers/release`

This is backend-capable and not UI-dependent.

## Access model

Selectors now carry:

- `profileId`
- `accessLevel`
- `selectorKind`
- capability metadata

Current access levels:

- `observer`
- `operator`
- `trusted_agent`
- `super_admin`
- `owner`

This prevents every selector from being treated like a fully privileged control.

## Truthful capability boundary

The catalog is explicit about what is real today.

Already real control families:

- connection fixtures / work-org selection
- worker lanes
- WhatsApp phone targets
- desktop control primitives

Real integrations but not yet full selector inventories:

- Telegram
- Google Workspace
- GCP

Reference-only until a dedicated executor exists:

- AnyDesk
- ExpressVPN as a product control surface
- Remote Desktop / mstsc as a managed control executor

This is deliberate. The catalog must not imply authority the code does not actually have.

## Important adjacent fix

`POST /api/policy/work-org/select` now persists runtime settings, so work identity selection no longer drifts relative to connection fixture selection.

## Current law for this category

1. Every selector must declare its `profileId`.
2. Every selector must declare its `accessLevel`.
3. Every selector must be honest about whether it is `reference` or `control`.
4. Runtime availability is derived from the live machine, not baked into canon.
5. Hardware-intensive lanes must acquire a tumbler slot before running.
6. No selector should imply direct control over AnyDesk, ExpressVPN, or RDP until a dedicated executor exists.

## Immediate next step

The next implementation layer should be:

1. wire a generated selector index cache
2. surface selector catalog summary in mobile/admin UI
3. add selector-action executors for safe categories
4. connect worker-router dispatch to tumbler acquisition
5. add explicit capability probes for paths, ports, and local tool health
