# NotebookLM Enterprise Readiness (2026-02-21)

## Summary
- Runtime status: API enabled, service account configured, IAM owner present.
- Current blocker: NotebookLM Enterprise license/subscription requirement for the calling principal.
- Local control endpoints for NotebookLM Enterprise are now active in Asolaria.

## Environment
- Project ID: `winged-complex-390417`
- Project Number: `742368506950`
- Service account: `asolaria-automation-service-ac@winged-complex-390417.iam.gserviceaccount.com`
- Notebook mirror account: `plasmatoid@gmail.com`

## Implemented Controls
- `GET /api/integrations/notebooklm/enterprise/status`
- `GET /api/integrations/notebooklm/enterprise/notebooks`
- `POST /api/integrations/notebooklm/enterprise/notebooks`
- `POST /api/integrations/notebooklm/enterprise/sources/batch_create`
- Routed commands:
  - `notebooklm enterprise status`
  - `notebooklm enterprise list <project> <location> <limit>`
  - `notebooklm enterprise create <project> <location> <title>`

## GCP Bootstrap Automation
- Endpoint: `POST /api/integrations/gcp/services/bootstrap`
- Profiles:
  - `asolaria_core`
  - `notebooklm_enterprise`
  - `google_oauth`
  - `ai_core`
- Routed command:
  - `gcp bootstrap services <project> <profile>`

## Validation Results
- NotebookLM Enterprise status job: `enterpriseReady=false`, blocker indicates required subscription-tier license.
- NotebookLM Enterprise list/create calls: failed with required NotebookLM license messages.
- GCP bootstrap jobs:
  - `notebooklm_enterprise`: all required services already enabled.
  - `asolaria_core`: all required services already enabled.
  - `google_oauth`: all required services already enabled.

## Mirror Sync/Dedup Fix
- Fixed bug where mirror sync with blank account created a new Google Doc each run.
- Root cause: lookup used requested account only (blank), causing misses.
- Fix: resolve preferred account before lookup (default account or first connected account).
- Current stable mirror doc ID: `1fRUk7zojDI5vc4Ha36oTdcbNO0hErcZgmhGNwDJmgJQ`.

## Existing Older Mirror Docs
- Detected duplicate docs with same title:
  - `1fRUk7zojDI5vc4Ha36oTdcbNO0hErcZgmhGNwDJmgJQ` (active)
  - `10WWSRqska8BVv1YCO7BoxRXwPq8o05rVIMn57iFKJTM`
  - `1RsOuJPwzE1OefCPD2M7nfJotP98wV4VpY_76xJbKTHQ`
- No deletion performed.

## Next Required External Step
- Assign/activate NotebookLM Enterprise licensing for the principal that will call Discovery Engine Notebook APIs.
