# Overnight Google/GCP Comms Preflight

- Generated at: 2026-03-10 22:45 -03:00
- Scope: `C:\Users\acer\Asolaria`
- Target GCP project: `winged-complex-390417`
- Constraints honored: no secrets in output, no IAM role expansion, no new projects, no destructive changes

## Summary

Google OAuth, GCP service-account access, NotebookLM Enterprise, Slack, and Symphony are currently configured and reachable. No GCP API enablement was required because every API already allowlisted in Asolaria policy for the default project is already enabled.

Three issues remain:

1. The main Asolaria app process is listening on `4781` and `5443`, but `/api/health` on `http://127.0.0.1:4781/api/health` timed out repeatedly.
2. Augment is configured in `remote_mcp` mode, but the configured remote MCP endpoint was not reachable during this preflight and the local bridge status file is stale.
3. Gemini API and Vertex both authenticated successfully and returned HTTP `200`, but the current default model `gemini-3.1-pro-preview` produced no text content for a minimal `generateContent` probe, so the current text-generation path is degraded.

## Evidence

### Control plane

- `server.js` is running under `node.exe` and owns ports `4781` and `5443`.
- `http://127.0.0.1:4791/health` returned healthy gateway status.
- `http://127.0.0.1:4781/api/health` timed out twice, including a 20-second probe.
- Recent server logs show startup completed, but the app health endpoint is not serving promptly.

### Google OAuth

- Google OAuth config is present from vault.
- Allowed accounts are all connected.
- Primary runtime/default account is `plasmatoid@gmail.com`.
- Live Gmail probe against `gmail.googleapis.com/gmail/v1/users/me/profile` returned HTTP `200`.
- Connected accounts include valid `gmail.readonly`, `calendar.readonly`, `drive.readonly`, `documents.readonly`, `documents`, and `cloud-platform` scopes.

### GCP / default project

- GCP service account is configured from vault.
- Service account project is `winged-complex-390417`.
- Default project is `winged-complex-390417`.
- Allowed projects include `winged-complex-390417`.
- Allowlisted admin services from policy:
  - `serviceusage.googleapis.com`
  - `cloudresourcemanager.googleapis.com`
  - `iam.googleapis.com`
  - `aiplatform.googleapis.com`
  - `discoveryengine.googleapis.com`
  - `generativelanguage.googleapis.com`
  - `speech.googleapis.com`
  - `texttospeech.googleapis.com`
  - `drive.googleapis.com`
  - `docs.googleapis.com`
  - `gmail.googleapis.com`
  - `calendar-json.googleapis.com`
- Live Service Usage listing for `winged-complex-390417` showed every allowlisted service above already in state `ENABLED`.
- Result: no API enablement changes were needed or made.

### Gemini API

- Gemini API key config is present from vault.
- Default model is `gemini-3.1-pro-preview`.
- Live `generateContent` probe returned HTTP `200`.
- Returned payload showed `finishReason: MAX_TOKENS` and usage metadata, but no text parts in `candidates[].content.parts`.
- Current operational status: auth and endpoint reachability are healthy; current default-model text output via connector is degraded.

### Vertex AI

- Vertex config is present from vault.
- Project is `winged-complex-390417`.
- Location is `global`.
- Default model is `gemini-3.1-pro-preview`.
- Vertex budget guardrail is enabled and far below warning threshold.
- Live Vertex `generateContent` probe returned HTTP `200`.
- Returned payload showed model metadata and usage, but no text parts in the candidate content.
- Current operational status: service account auth and endpoint reachability are healthy; current default-model text output via connector is degraded.

### NotebookLM Enterprise

- NotebookLM Enterprise status resolved against `winged-complex-390417` in `global`.
- Discovery Engine API state is enabled.
- Recent notebook listing succeeded.
- `enterpriseReady` resolved `true` with no blockers.

### Slack

- Slack bot token is configured.
- Live `auth.test`-equivalent connector check succeeded.
- Workspace resolved as `Jesse's team`.
- Bot user resolved as `demo_app`.

### Symphony

- Symphony integration config is present from vault.
- Local process is running on port `4792`.
- Live state endpoint `http://127.0.0.1:4792/api/v1/state` returned HTTP `200`.
- Live state reported `1` running issue and `0` retrying.

### Augment

- Augment Context is configured from vault in `remote_mcp` mode for workspace `C:\Users\acer\Asolaria`.
- `.augmentignore` is present and provider apply data is internally consistent.
- Stored local bridge status file `logs/augment-mcp-bridge-status.json` reports a healthy bridge, but it was last written on 2026-03-06 and references upstream PID `19344`, which is no longer running.
- Live fetch to the configured remote MCP server URL failed.
- Current operational status: configuration is present, but live endpoint availability could not be confirmed and stale bridge evidence suggests the existing bridge/tunnel state is no longer current.

## Outcome

- GCP API changes made: none
- Missing allowlisted APIs: none
- IAM changes made: none
- Destructive actions taken: none

## Morning follow-up

1. Restart or inspect the main Asolaria app behind port `4781` until `/api/health` returns promptly.
2. Refresh the Augment bridge/tunnel and confirm the remote MCP endpoint is reachable again.
3. Revisit the current Gemini/Vertex default model path; the APIs are reachable, but `gemini-3.1-pro-preview` is not returning text content under the current minimal connector probe.
