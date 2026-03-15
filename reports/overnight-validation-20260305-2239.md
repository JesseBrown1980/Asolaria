# Overnight Validation Report - 2026-03-05 22:39

## Scope
- Continue live testing while user offline.
- Verify latest mobile safe-area/topbar fix and routing resilience.

## Code Change Applied
- Added standalone mobile fallback top padding for dashboard shell:
  - public/styles.css
  - Rule: @media (display-mode: standalone) and (max-width: 980px) { .app-shell { padding-top: max(calc(16px + var(--safe-area-top)), 44px); } }

## Runtime Health
- GET /api/health => ok=true
- stealthMode=false
- phoneTunnelMonitor.running=true
- phoneBridgeKeeper.running=true

## Automated Test Runs

### 1) Live Control Sweep
- Artifact: eports/live-control-sweep-20260305-222604.json
- Summary:
  - / => controls 38, tested 35, failures 0
  - /phone-mode.html?... => controls 12, tested 8, failures 1
  - /mobile-console.html?... => controls 106, tested 90, failures 13
  - /mobile-approvals.html?... => controls 4, tested 4, failures 0
- Notes:
  - Failures are locator_not_found only (dynamic UI churn), no JS runtime exceptions.

### 2) UI Visual Audit (Desktop + Mobile Viewports)
- Artifact (latest): eports/ui-visual-audit/latest.md
- Run folder: eports/ui-visual-audit/20260305-223157/
- Result:
  - Web checks: 28
  - Web issues: 0
  - Local window status: ok
  - Total issues: 0

### 3) Targeted Routing and Launcher Checks (Playwright, service workers blocked)
- Hidden launchers default:
  - ndroidOpenTermuxBtn hidden = true
  - ndroidOpenFdroidBtn hidden = true
- USB failover path when API returns forced 503:
  - Mobile Console redirected to https://example.com/mobile-console.html?...&channel=public_internet
  - Phone Mode redirected to https://example.com/phone-mode.html?...&channel=public_internet
  - Both failover checks = true

### 4) Tunnel/Keeper Status
- Artifact: eports/phone-tunnel-smoke-latest.md
- Result highlights:
  - pass: true
  - remote health ok
  - control plane healthy
  - keeper running
  - authorized device count: 1

## Mobile Geometry Baseline (Browser-mode)
- Screenshot: eports/mobile-dashboard-390x844-20260305-2237.png
- Metrics at 390x844 in browser mode:
  - pp-shell padding-top: 16px
  - 	opbar top: 16px
  - --safe-area-top: 0px (browser mode)
- Note:
  - Standalone fallback rule is expected to apply in installed PWA mode on phone.

## Outstanding Risk
- Control sweep still reports locator churn on dynamic controls in mobile-console. This appears non-fatal but inflates failure counts.

