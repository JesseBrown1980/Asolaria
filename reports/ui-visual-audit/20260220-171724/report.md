# Asolaria UI Visual Audit

- Generated: 2026-02-20T20:19:12.067Z
- Base URL: http://127.0.0.1:4781
- Pages: 4
- Viewports: 7
- Total web checks: 28
- Web issues: 8
- Local window audit: issue
- Total issues: 9
- Pinch zoom checks enabled: yes
- Local window checks enabled: yes

## Web Summary

| Page | Viewport | Status | Overflow Px | Overlap Pairs | Pinch Zoom | Screenshot |
| --- | --- | --- | ---: | ---: | --- | --- |
| Asolaria Dashboard | Full HD (1920x1080) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__full_hd.png` |
| Asolaria Dashboard | Half HD (960x1080) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__half_hd.png` |
| Asolaria Dashboard | Quarter HD (960x540) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__quarter_hd.png` |
| Asolaria Dashboard | Laptop (1366x768) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__laptop.png` |
| Asolaria Dashboard | Tablet Portrait (768x1024) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__tablet_portrait.png` |
| Asolaria Dashboard | Mobile Portrait (390x844) | issue | 0 | 0 | issue | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__mobile_portrait.png` |
| Asolaria Dashboard | Mobile Landscape (844x390) | issue | 0 | 0 | issue | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__mobile_landscape.png` |
| Asolaria Phone Mode | Full HD (1920x1080) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__full_hd.png` |
| Asolaria Phone Mode | Half HD (960x1080) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__half_hd.png` |
| Asolaria Phone Mode | Quarter HD (960x540) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__quarter_hd.png` |
| Asolaria Phone Mode | Laptop (1366x768) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__laptop.png` |
| Asolaria Phone Mode | Tablet Portrait (768x1024) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__tablet_portrait.png` |
| Asolaria Phone Mode | Mobile Portrait (390x844) | issue | 0 | 0 | issue | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__mobile_portrait.png` |
| Asolaria Phone Mode | Mobile Landscape (844x390) | issue | 0 | 0 | issue | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__mobile_landscape.png` |
| Mobile Console | Full HD (1920x1080) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__full_hd.png` |
| Mobile Console | Half HD (960x1080) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__half_hd.png` |
| Mobile Console | Quarter HD (960x540) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__quarter_hd.png` |
| Mobile Console | Laptop (1366x768) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__laptop.png` |
| Mobile Console | Tablet Portrait (768x1024) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__tablet_portrait.png` |
| Mobile Console | Mobile Portrait (390x844) | issue | 0 | 0 | issue | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__mobile_portrait.png` |
| Mobile Console | Mobile Landscape (844x390) | issue | 0 | 0 | issue | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__mobile_landscape.png` |
| Mobile Approvals | Full HD (1920x1080) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__full_hd.png` |
| Mobile Approvals | Half HD (960x1080) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__half_hd.png` |
| Mobile Approvals | Quarter HD (960x540) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__quarter_hd.png` |
| Mobile Approvals | Laptop (1366x768) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__laptop.png` |
| Mobile Approvals | Tablet Portrait (768x1024) | ok | 0 | 0 | - | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__tablet_portrait.png` |
| Mobile Approvals | Mobile Portrait (390x844) | issue | 0 | 0 | issue | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__mobile_portrait.png` |
| Mobile Approvals | Mobile Landscape (844x390) | issue | 0 | 0 | issue | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__mobile_landscape.png` |

## Detailed Issues

### Asolaria Dashboard - Mobile Portrait (390x844)
- URL: http://127.0.0.1:4781/
- Screenshot: `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__mobile_portrait.png`
- Horizontal overflow px: 0
- Overflow elements: 3
- Overlap pairs: 0
- Small controls: 15
- Pinch zoom status: issue
- Pinch zoom notes: pinch_zoom_scale_did_not_change_as_expected
- Overflow samples:
  - select#skillsSelect.- (37, 2473) -> (720, 2516)
  - input#skillsInput.- (37, 2524) -> (720, 2565)
  - button#-.- (37, 2573) -> (720, 2612)
- Small control samples:
  - input#stealthToggle (15x15)
  - select#approvalMode (86x28)
  - select#costMode (99x28)
  - select#codexWebSearch (58x28)
  - select#openclawMode (103x28)
  - button#projectRefreshBtn (116x28)
  - button#projectCreateBtn (92x28)
  - button#projectUpdateBtn (97x28)
  - button#projectDeleteBtn (113x28)
  - input#externalObservedAutoPruneEnabled (13x13)
  - input#allowExternalPosting (13x13)
  - input#guardianAlertsEnabled (13x13)
  - input#guardianAutoBlockCritical (13x13)
  - input#padDisableShots (13x13)
  - input#taskLedgerIncludeArchived (13x13)

### Asolaria Dashboard - Mobile Landscape (844x390)
- URL: http://127.0.0.1:4781/
- Screenshot: `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__mobile_landscape.png`
- Horizontal overflow px: 0
- Overflow elements: 0
- Overlap pairs: 0
- Small controls: 15
- Pinch zoom status: issue
- Pinch zoom notes: pinch_zoom_scale_did_not_change_as_expected
- Small control samples:
  - input#stealthToggle (15x15)
  - select#approvalMode (86x28)
  - select#costMode (99x28)
  - select#codexWebSearch (58x28)
  - select#openclawMode (103x28)
  - button#projectRefreshBtn (116x28)
  - button#projectCreateBtn (92x28)
  - button#projectUpdateBtn (97x28)
  - button#projectDeleteBtn (113x28)
  - input#externalObservedAutoPruneEnabled (13x13)
  - input#allowExternalPosting (13x13)
  - input#guardianAlertsEnabled (13x13)
  - input#guardianAutoBlockCritical (13x13)
  - input#padDisableShots (13x13)
  - input#taskLedgerIncludeArchived (13x13)

### Asolaria Phone Mode - Mobile Portrait (390x844)
- URL: http://127.0.0.1:4781/phone-mode.html
- Screenshot: `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__mobile_portrait.png`
- Horizontal overflow px: 0
- Overflow elements: 0
- Overlap pairs: 0
- Small controls: 5
- Pinch zoom status: issue
- Pinch zoom notes: pinch_zoom_scale_did_not_change_as_expected
- Small control samples:
  - input#observerFollowToggle (16x16)
  - input#proMirrorAlwaysOnTop (16x16)
  - input#proMirrorNoAudio (16x16)
  - input#waEnabled (16x16)
  - input#waIncludeVoice (16x16)

### Asolaria Phone Mode - Mobile Landscape (844x390)
- URL: http://127.0.0.1:4781/phone-mode.html
- Screenshot: `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__mobile_landscape.png`
- Horizontal overflow px: 0
- Overflow elements: 0
- Overlap pairs: 0
- Small controls: 5
- Pinch zoom status: issue
- Pinch zoom notes: pinch_zoom_scale_did_not_change_as_expected
- Small control samples:
  - input#observerFollowToggle (16x16)
  - input#proMirrorAlwaysOnTop (16x16)
  - input#proMirrorNoAudio (16x16)
  - input#waEnabled (16x16)
  - input#waIncludeVoice (16x16)

### Mobile Console - Mobile Portrait (390x844)
- URL: http://127.0.0.1:4781/mobile-console.html?channel=usb
- Screenshot: `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__mobile_portrait.png`
- Horizontal overflow px: 0
- Overflow elements: 0
- Overlap pairs: 0
- Small controls: 1
- Pinch zoom status: issue
- Pinch zoom notes: pinch_zoom_scale_did_not_change_as_expected
- Small control samples:
  - input#taskLedgerIncludeArchived (13x13)

### Mobile Console - Mobile Landscape (844x390)
- URL: http://127.0.0.1:4781/mobile-console.html?channel=usb
- Screenshot: `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__mobile_landscape.png`
- Horizontal overflow px: 0
- Overflow elements: 0
- Overlap pairs: 0
- Small controls: 1
- Pinch zoom status: issue
- Pinch zoom notes: pinch_zoom_scale_did_not_change_as_expected
- Small control samples:
  - input#taskLedgerIncludeArchived (13x13)

### Mobile Approvals - Mobile Portrait (390x844)
- URL: http://127.0.0.1:4781/mobile-approvals.html?channel=usb
- Screenshot: `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__mobile_portrait.png`
- Horizontal overflow px: 0
- Overflow elements: 0
- Overlap pairs: 0
- Small controls: 1
- Pinch zoom status: issue
- Pinch zoom notes: pinch_zoom_scale_did_not_change_as_expected
- Small control samples:
  - input#criticalOnly (295x13)

### Mobile Approvals - Mobile Landscape (844x390)
- URL: http://127.0.0.1:4781/mobile-approvals.html?channel=usb
- Screenshot: `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__mobile_landscape.png`
- Horizontal overflow px: 0
- Overflow elements: 0
- Overlap pairs: 0
- Small controls: 1
- Pinch zoom status: issue
- Pinch zoom notes: pinch_zoom_scale_did_not_change_as_expected
- Small control samples:
  - input#criticalOnly (13x13)

## Pinch Zoom Checks

| Page | Viewport | Status | Before | After In | After Out | Zoom In Shot | Zoom Out Shot |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| Asolaria Dashboard | Mobile Portrait | issue | 1.000 | 1.000 | 1.000 | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__mobile_portrait__pinch_zoom_in.png` | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__mobile_portrait__pinch_zoom_out.png` |
| Asolaria Dashboard | Mobile Landscape | issue | 1.000 | 1.000 | 1.000 | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__mobile_landscape__pinch_zoom_in.png` | `reports/ui-visual-audit/20260220-171724/screenshots/dashboard__mobile_landscape__pinch_zoom_out.png` |
| Asolaria Phone Mode | Mobile Portrait | issue | 1.000 | 1.000 | 1.000 | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__mobile_portrait__pinch_zoom_in.png` | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__mobile_portrait__pinch_zoom_out.png` |
| Asolaria Phone Mode | Mobile Landscape | issue | 1.000 | 1.000 | 1.000 | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__mobile_landscape__pinch_zoom_in.png` | `reports/ui-visual-audit/20260220-171724/screenshots/phone_mode__mobile_landscape__pinch_zoom_out.png` |
| Mobile Console | Mobile Portrait | issue | 1.000 | 1.000 | 1.000 | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__mobile_portrait__pinch_zoom_in.png` | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__mobile_portrait__pinch_zoom_out.png` |
| Mobile Console | Mobile Landscape | issue | 1.000 | 1.000 | 1.000 | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__mobile_landscape__pinch_zoom_in.png` | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_console__mobile_landscape__pinch_zoom_out.png` |
| Mobile Approvals | Mobile Portrait | issue | 1.000 | 1.000 | 1.000 | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__mobile_portrait__pinch_zoom_in.png` | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__mobile_portrait__pinch_zoom_out.png` |
| Mobile Approvals | Mobile Landscape | issue | 1.000 | 1.000 | 1.000 | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__mobile_landscape__pinch_zoom_in.png` | `reports/ui-visual-audit/20260220-171724/screenshots/mobile_approvals__mobile_landscape__pinch_zoom_out.png` |

## Local Window Audit

- Status: issue
- Reason: -
- Matched windows: 3 / 9
- Checks run: 3

| Window | Status | Actions | Screenshot | Error |
| --- | --- | --- | --- | --- |
| Asolaria Her Phone Mode | issue | - | `-` | POST /api/mobile/windows/focus failed (400): Phone control is disarmed. Tap Arm Control first. |
| Asolaria | issue | - | `-` | POST /api/mobile/windows/focus failed (400): Phone control is disarmed. Tap Arm Control first. |
| Asolaria - Google Chrome | issue | - | `-` | POST /api/mobile/windows/focus failed (400): Phone control is disarmed. Tap Arm Control first. |

- Errors:
  - Asolaria Her Phone Mode: POST /api/mobile/windows/focus failed (400): Phone control is disarmed. Tap Arm Control first.
  - Asolaria: POST /api/mobile/windows/focus failed (400): Phone control is disarmed. Tap Arm Control first.
  - Asolaria - Google Chrome: POST /api/mobile/windows/focus failed (400): Phone control is disarmed. Tap Arm Control first.
  - restore_active_window_failed: POST /api/mobile/windows/focus failed (400): Phone control is disarmed. Tap Arm Control first.