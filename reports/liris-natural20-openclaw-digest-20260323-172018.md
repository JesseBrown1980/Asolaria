# Liris Natural20 OpenClaw Digest

- Ingested: `2026-03-23 17:20:18 -03:00`
- Source DOCX: `C:\Users\acer\Downloads\Liris comment Natural 20 and open claw artifiacts and potential.docx`
- Extracted text: `tmp/docs/liris-comment-natural20-openclaw-artifacts-potential-extracted.txt`

## Classification

This document is mixed-scope.

It contains:

- preserved Rayssa-side rerun and compute packet material already superseded by `IX-300`
- Liris opinion and repo review around Natural20
- Liris opinion and repo review around old OpenClaw surfaces
- external OpenClaw release-note and docs references

It is not a new startup packet and it does not change the current compute boundary in `IX-300`.

## Durable Truth Worth Keeping

### 1. Natural20 boundary

The useful durable rule is architectural, not operational:

- Natural20 is an outside-world intelligence feed
- it is useful for external AI ecosystem updates, model/vendor changes, and ambient daily awareness
- it is not the correct source of truth for internal colony oversight

The document’s own conclusion is clean:

- `Natural20 = outside world`
- `Civilization Oversight = inside Asolaria`

For internal truth, keep using Asolaria-native telemetry:

- task ledger
- graph/action manifests
- approvals
- mailbox/comms
- worker dispatches
- MQTT node state

### 2. OpenClaw must stay host-scoped

The document argues that on Rayssa host, OpenClaw should be treated as retired/stale and not re-enabled as-is.

That is usable as a Rayssa-host note, but it is not portable global truth.

## Jesse Checkout Cross-Check

Current Jesse checkout still exposes materially live OpenClaw surfaces:

- UI mode control exists in `public/index.html`
- OpenClaw control card exists in `public/index.html`
- client code still posts to `/api/openclaw/action` from `public/app.js`
- settings still expose `openclawMode` through `routes/remaining.js`
- intent routes still parse `openclaw ...` commands in `src/intentRouter.js`
- provider fallback and connector code still exist in `src/brainOrchestrator.js` and `src/connectors/openclawConnector.js`

So the correct integrated conclusion is:

- Liris’s “OpenClaw is retired/not actively wired” reading is host-scoped to her Rayssa-side review
- Jesse checkout still has active OpenClaw UI/control/router surfaces
- Asolaria currently has OpenClaw status drift across hosts and docs, not a single clean truth

## Memory Boundary

Promote only these rules:

- keep Natural20 as external-awareness support, not internal-governance truth
- keep OpenClaw claims host-scoped until the Jesse/Rayssa drift is reconciled
- do not import OpenClaw release-note excitement into Helm startup memory
- do not treat this DOCX as newer than `IX-300` on compute readiness
