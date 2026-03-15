# Submission Packet Notes

Date: 2026-02-27

Current state:
- Asolaria auto-run executed OAuth start + Google scope demos.
- Demo evidence file created:
  - `reports/release-demo/asolaria-auto-demo-run.json`
  - `reports/release-demo/asolaria-auto-demo-run-postauth.json`
- Test evidence updated:
  - `reports/release-demo/test-evidence.md`
- Owner completed Google re-authorization callback:
  - Account: `plasmatoid@gmail.com`
  - Expires: `2026-02-27T20:19:30.070Z`
  - Refresh token: `yes`

Final references:
- Unlisted demo URL: `https://youtu.be/hI6L_MvYSJw`
- Consent-screen details: this file (`## Consent-screen details`)
- Scope justifications: this file (`## Consent-screen details`)
- Privacy policy URL: `https://www.jbrowndevelopmentllc.com/privacy`
- Terms of service URL: `https://www.jbrowndevelopmentllc.com/terms`
- Developer website: `https://www.jbrowndevelopmentllc.com/`
- Reviewer notes: this file (`## Reviewer notes draft`)

## Consent-screen details (pending final clip)

- OAuth endpoint: `POST /api/integrations/google/oauth/start`
- Redirect URI shown in app:
  - `http://127.0.0.1:4781/api/integrations/google/oauth/callback`
- Requested scopes visible in status:
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/drive.readonly`
  - `https://www.googleapis.com/auth/documents.readonly`
  - `https://www.googleapis.com/auth/documents`
  - `https://www.googleapis.com/auth/cloud-platform`

## Reviewer notes draft

- This submission demonstrates user-initiated OAuth consent and post-consent data access.
- API calls are executed server-side by Asolaria after explicit user action in the local integration console.
- Post-auth validation confirmed Cloud Resource Manager, BigQuery, and Cloud Storage API calls complete successfully.

## Gate status (2026-02-27 post-auth)

- Release stage: `dist/public-release/Asolaria-Public-20260227-verify1`
- Release zip SHA256:
  - `F5FB7C3620A2F6858178E3A4753E4AC91D4130EA594A563356F752F967039552`
- Unlisted demo URL:
  - `https://youtu.be/hI6L_MvYSJw`
- Play track proof file:
  - `reports/release-demo/play-track-proof.txt`
- Gate verification:
  - `tools/Test-Asolaria-PublishDemoGates.ps1 -StageRoot dist/public-release/Asolaria-Public-20260227-verify1`
  - Result: pass (`failedCount=0`) at `2026-02-27T16:48:03.9184154-03:00`

## Play Console status (2026-02-27)

- Developer account type: personal (`Yourself`)
- Registration fee: paid (receipt sent to `plasmatoid@gmail.com`)
- Current blocker: Google Play identity verification pending
- Additional dependency: contact phone verification becomes available after identity verification completes
- Next operational mode: prepare listing + data safety + internal testing release draft, then wait for Google verification email to complete rollout actions

## Play Console operator files

- `reports/release-demo/play-console-form-answers.md`
- `reports/release-demo/play-console-pending-verification-checklist.md`
- `reports/release-demo/play-console-assets-manifest.md`
