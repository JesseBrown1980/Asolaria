# Play Console Pending-Verification Checklist

Date: 2026-02-27
Status: Developer account created, identity verification pending from Google.

## Do Now (Not Blocked)

- [x] Developer account registration completed and fee paid
- [x] Publish/demo gates passed (`reports/release-demo/publish-demo-gate-report.json`)
- [x] Demo uploaded unlisted (`https://youtu.be/hI6L_MvYSJw`)
- [x] Release artifact ready (`app-release.aab`)
- [x] Privacy/terms URLs live (`/privacy`, `/terms`)
- [x] Store assets bundle prepared (`play-console-assets-manifest.md`)
- [ ] Create app entry in Play Console (`Asolaria`, free app)
- [ ] Fill store listing text using `play-console-form-answers.md`
- [ ] Fill Data Safety using conservative draft in `play-console-form-answers.md`
- [ ] Fill App Content (target audience/content rating/ads)
- [ ] Save internal testing release draft with `app-release.aab`

## Blocked Until Google Verification Email

- [ ] Identity verification approved
- [ ] Contact phone verified (unlocks publish-critical actions)
- [ ] Internal testing rollout started
- [ ] Internal test opt-in link generated and validated

## Immediate Next Click Path After Approval

1. Open Google Play Console with `plasmatoid@gmail.com`
2. Verify contact phone if prompted
3. Go to `Testing` -> `Internal testing` -> `Create new release`
4. Upload:
   - `C:\Users\acer\Asolaria-Android\AsolariaCompanion\app\build\outputs\bundle\release\app-release.aab`
5. Add release notes (from `play-console-form-answers.md`)
6. Save -> Review release -> Start rollout to internal testing
7. Add tester emails and validate opt-in link

## Agent Coordination Log

- Local helper agents completed:
  - Data Safety lane (manifest + runtime behavior review)
  - Store listing copy lane (short/full description + release notes)
  - Pending-verification operations lane (blocked vs available actions)
- Local relay broadcast sent to active Asolaria bridge agents (excluding Oli/John request): message id `17719` in room `asolaria_bridge`.
