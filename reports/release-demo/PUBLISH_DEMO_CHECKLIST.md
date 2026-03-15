# Publish + Demo Checklist (Template)

Use this template for a release-specific checklist copy:

`reports/release-demo/PUBLISH_DEMO_CHECKLIST.md`

The gate script enforces only lines that start with `GATE:`.

## Checklist

- [x] GATE: Public release stage folder exists (`dist/public-release*/Asolaria-Public-<version>`).
- [x] GATE: Public release zip exists and SHA256 is recorded.
- [x] GATE: `LEAK_SCAN_REPORT.json` exists and contains zero findings (`[]`).
- [x] GATE: `PUBLIC_RELEASE_NOTES.md` exists for this stage and was reviewed.
- [x] GATE: Unlisted demo video URL is saved in `reports/release-demo/demo-video-url.txt`.
- [x] GATE: Startup/connect/reconnect test evidence is saved in `reports/release-demo/test-evidence.md`.
- [x] GATE: Play Console testing track proof is saved in `reports/release-demo/play-track-proof.txt`.
- [x] GATE: Submission packet notes are saved in `reports/release-demo/submission-packet.md`.
- [x] GATE: Owner sign-off is completed (name + UTC timestamp).

## Owner Sign-off

- Name: Jesse Daniel Brown
- UTC timestamp: 2026-02-27T19:47:41.0151828Z
- Notes: Demo URL and release evidence captured; publish demo gate checklist completed for verify1 packet.
