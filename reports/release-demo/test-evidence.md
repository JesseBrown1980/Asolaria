# Test Evidence

Date: 2026-02-27
Operator: Asolaria auto-run + Codex

## Startup/connect/reconnect

- Asolaria local API reachable at `http://127.0.0.1:4781`.
- Chrome main UI focused on `Asolaria Admin: Integrations`.
- AutoPlay disabled (`HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\AutoplayHandlers\\DisableAutoplay=1`) to prevent USB/MTP Explorer popup interference during demo capture.

## OAuth flow evidence

- OAuth start triggered by Asolaria API:
  - `POST /api/integrations/google/oauth/start` with `account=plasmatoid@gmail.com`
  - OAuth URL opened by Asolaria:
    - `POST /api/chrome/open` (`windowTarget=local_ui`)
  - Evidence artifact: `reports/release-demo/asolaria-auto-demo-run.json`
  - Re-authorization completed by owner:
    - Callback success message captured at `2026-02-27T19:19:31Z`
    - `account=plasmatoid@gmail.com`
    - `refresh_token=yes`
    - `expiresAt=2026-02-27T20:19:30.070Z`

## Google scope demo evidence (Asolaria-run)

- Cloud Resource Manager:
  - `GET https://cloudresourcemanager.googleapis.com/v1/projects/winged-complex-390417`
  - Job `job_1772219115111_qg04yv` completed, HTTP 200
- BigQuery datasets:
  - `GET https://bigquery.googleapis.com/bigquery/v2/projects/winged-complex-390417/datasets?maxResults=5`
  - Job `job_1772219116661_xa6yn8` completed, HTTP 200
- Cloud Storage buckets:
  - `GET https://storage.googleapis.com/storage/v1/b?project=winged-complex-390417&maxResults=5`
  - Job `job_1772219117462_fzklyf` completed, HTTP 200

## Google scope demo evidence (post-auth re-run)

- Evidence artifact: `reports/release-demo/asolaria-auto-demo-run-postauth.json`
- Cloud Resource Manager:
  - Job `job_1772220006155_k8wamf` completed, HTTP 200
- BigQuery datasets:
  - Job `job_1772220007449_9qkamp` completed, HTTP 200
- Cloud Storage buckets:
  - Job `job_1772220008065_qve4yg` completed, HTTP 200

## Status snapshot

- Google integration status:
  - `primaryConnected=true`
  - `defaultAccount=plasmatoid@gmail.com`

## Notes

- Automated portion is complete.
- Remaining reviewer requirement is the visual consent-screen recording clip for Google verification submission.
