# Play Console Form Answers (Draft)

Date: 2026-02-27
Owner account: `plasmatoid@gmail.com`

Use this as copy/paste guidance while Google Play identity verification is pending.

## App Metadata

- App name: `Asolaria`
- Package: `com.jessebrown.asolaria`
- Version name/code: `0.1.0` / `1`
- Release artifact:
  - `C:\Users\acer\Asolaria-Android\AsolariaCompanion\app\build\outputs\bundle\release\app-release.aab`
- Store assets manifest:
  - `C:\Users\acer\Asolaria\reports\release-demo\play-console-assets-manifest.md`

## Store Listing Copy

- Short description (<= 80):
  - `Secure Android companion for Asolaria desktop and Google workflow sign-in.`

- Full description:
  - `Asolaria is the Android companion app for the Asolaria workflow stack, focused on secure Google-connected demo flows and release readiness.`
  - `This release is built to validate registration, OAuth consent, and controlled connectivity between Android and the local Asolaria environment.`
  - `Key capabilities in this version:`
  - `- Launch and connect to Asolaria mobile console endpoints over local/remote routes configured by the user.`
  - `- User-initiated Google OAuth consent flow through the Asolaria integration path.`
  - `- Post-auth validation checks for connected Google services in the Asolaria workflow.`
  - `- Optional Termux command handoff when explicitly requested by the user and permission is granted.`
  - `This is a foundational build intended for internal testing and verification before broader rollout.`

- Release notes (`0.1.0`, code `1`):
  - `Initial Android companion release for Asolaria.`
  - `Adds user-initiated Google OAuth integration flow.`
  - `Adds secure mobile console connectivity and bootstrap token workflow.`
  - `Adds optional Termux handoff path with explicit permission checks.`
  - `Adds release/demo evidence workflow used for registration readiness.`

## Data Safety (Conservative Draft)

Use conservative answers to avoid under-disclosure.

- Data collected:
  - `App activity` -> `App interactions` (collected, not shared)
  - `App info and performance` -> `Diagnostics` (collected if server/app logging is enabled, not shared)
  - Everything else: `No` unless a new feature clearly adds it

- Data shared with third parties:
  - `No` (no ads SDKs or third-party analytics SDKs found in Android app dependencies)

- Data handling:
  - Data encrypted in transit: `No` (app supports local `http://127.0.0.1:4781` fallback and cleartext is permitted in `network_security_config.xml`)
  - Data deletion request path: `Yes, via support contact` (`jesse@jbrowndevelopmentllc.com`)

## Content Rating / App Content (Draft)

- Target audience: not children-focused
- Ads: `No`
- News/government/medical/financial/gambling categories: `No`
- UGC/social/chat: `No`
- Primary purpose: productivity / tools companion

## Public Links

- Website: `https://www.jbrowndevelopmentllc.com/`
- Privacy policy: `https://www.jbrowndevelopmentllc.com/privacy`
- Terms: `https://www.jbrowndevelopmentllc.com/terms`
- Demo video (unlisted): `https://youtu.be/hI6L_MvYSJw`
