# Chrome Profile Verification (2026-02-22)

## Run info
- Script: `tools/Verify-ChromeProfiles-OneByOne.ps1`
- Run directory: `captures/chrome-profile-verify/20260222-121149`
- Report JSON: `captures/chrome-profile-verify/20260222-121149/report.json`
- VPN process detected: `true`
- Restricted-profile VPN gate enabled: `true`

## Summary
- Total profiles checked: `12`
- Likely logged in: `1`
- Possible reauth needed: `8`
- Login needed: `3`
- Unknown: `0`
- Errors: `0`

## Per-profile status
1. `Profile` (`Seu Chrome`) -> `login_needed`
2. `Profile 11` (`Seu Chrome`) -> `login_needed`
3. `Profile 13` (`Emergencetek-JDBrown`) -> `login_needed` (restricted)
4. `Profile 16` (`Seu Chrome`, `jesseisrael.soft1980@gmail.com`) -> `possible_reauth_needed`
5. `Profile 20` (`CSI - JesseCali`, `jessebrown.soft1980@gmail.com`) -> `possible_reauth_needed` (restricted)
6. `Profile 21` (`jbrowndevelopmentllc.com`, `jesse@jbrowndevelopmentllc.com`) -> `possible_reauth_needed`
7. `Profile 23` (`Seu Chrome`, `jesse.brown@spinutech.com`) -> `possible_reauth_needed` (restricted)
8. `Profile 24` (`Spiinutech-Remote`, `reesedev93@gmail.com`) -> `possible_reauth_needed`
9. `Profile 25` (`Your Chrome`, `raychiqueto00@gmail.com`) -> `possible_reauth_needed`
10. `Profile 26` (`Tof Wd`, `jessebrownplasma16@gmail.com`) -> `possible_reauth_needed`
11. `Profile 3` (`Jesse Daniel`, `plasmatoid@gmail.com`) -> `likely_logged_in`
12. `Profile 31` (`Your Chrome`, `jesseusa.soft1980@gmail.com`) -> `possible_reauth_needed`

## Evidence captured for each profile
- `window-focus.png` (focused Chrome window)
- `screen-all.png` (combined desktop)
- `screen-0.png` and `screen-1.png` (per monitor)
- `manifest.json` (capture metadata)
