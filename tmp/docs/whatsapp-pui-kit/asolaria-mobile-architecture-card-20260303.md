# Asolaria Mobile Architecture Card (Sanitized)

Date: 2026-03-03  
Scope: Cellphone architecture, always-on behavior, trust boundaries, and hardening priorities  
Sensitivity: Sanitized (no secrets/tokens/passwords)

## 1) Purpose

This card describes how Asolaria extends its control plane to mobile devices with:
- Remote observability
- Bidirectional control under explicit authority
- Approval workflows and push notifications
- Tunnel/USB fallback routing
- Always-on monitoring loops with safety guardrails

---

## 2) Mobile Plane Overview

### Core components
1. **Mobile auth/session layer**
   - Bootstrap + session validation endpoints
   - Token rotation support
2. **Mobile screen/control layer**
   - Screen status/displays/capture/image
   - Control arm/disarm and input actions (click/scroll/type/key)
3. **Phone bridge/mirror layer**
   - Mirror/pro-mirror status and control
   - Phone developer options and automation actions
4. **Ops/health layer**
   - Bridge keeper status
   - Tunnel monitor status
   - Diagnostics and recovery endpoints
5. **Approval/push layer**
   - Mobile approvals list/detail/approve/deny
   - Push public key/status/subscribe/unsubscribe/test

---

## 3) Route Families (Sanitized Capability View)

### `api/mobile/*` family
- `session`, `bootstrap`, `token/rotate`
- `screen/*`, `control/*`, `windows/*`
- `bridge/keeper/status`, `tunnel/monitor/status`, diagnostics
- `push/*`, approvals endpoints, UI open/cleanup, help/recover

### `api/phone/*` family
- Developer options catalog/status/set/sweep
- Mirror and pro-mirror status/control/capture/image
- WhatsApp-linked helper actions (guarded)

### `api/power/*` family (mobile-triggered where authorized)
- Status, shutdown/restart/abort
- Wake-on-LAN status/config/send

---

## 4) Security and Control Boundaries

### Current control gates
- `requireMobileAuth` on mobile endpoints
- Additional high-risk gating:
  - `requireMobileDirectControlEnabled`
  - `requireDesktopSuperMasterAuthority`
- Arm/disarm pattern for direct control windows
- Allowlist-backed authority model for desktop/phone lanes

### Practical trust model
- Read-only status and telemetry can stay broadly available to authorized mobile clients.
- Active control actions require both auth and elevated authority gates.
- Approval routes add an explicit human-in-the-loop path for risky actions.

---

## 5) Route-to-Gate Security Matrix (Audit View)

| Route pattern | Auth required | Extra gate(s) | Approval expectation | Fail behavior target |
|---|---|---|---|---|
| `/api/mobile/session`, `/api/mobile/bootstrap` | Mobile auth/boot token flow | None | Not required | Deny unauthenticated |
| `/api/mobile/screen/*` | `requireMobileAuth` | None for read operations | Not required | Deny without token |
| `/api/mobile/control/arm|disarm` | `requireMobileAuth` | `requireMobileDirectControlEnabled`, `requireDesktopSuperMasterAuthority` | Recommended for remote operators | Fail closed |
| `/api/mobile/control/click|scroll|type|key` | `requireMobileAuth` | `requireMobileDirectControlEnabled`, `requireDesktopSuperMasterAuthority` | Required for risky sessions | Fail closed |
| `/api/mobile/windows/focus|action` | `requireMobileAuth` | `requireMobileDirectControlEnabled`, `requireDesktopSuperMasterAuthority` | Required when remote | Fail closed |
| `/api/phone/mirror/control/*` | Phone bridge access | `requireDesktopSuperMasterAuthority` | Required for high-risk actions | Fail closed |
| `/api/power/shutdown|restart|abort` | `requireMobileAuth` | `requireMobileDirectControlEnabled`, `requireDesktopSuperMasterAuthority` | Mandatory | Fail closed |
| `/api/mobile/approvals/*` | `requireMobileAuth` | Approval workflow semantics | Mandatory by policy class | Deny if unresolved |
| `/api/mobile/push/*` | `requireMobileAuth` | Subscription validation | Not required for status | Deny malformed/unauthorized |

Implementation note:
- This matrix should be converted to CI assertions by extracting route middleware from `server.js` and diffing against this table.

---

## 6) Always-On Bidirectional Design

### What "always-on" means in this architecture
- Phone bridge keeper runs in background and maintains connectivity primitives.
- Tunnel smoke monitor continuously validates remote path health.
- Mobile UI can request status, trigger approved actions, and receive push updates.

### Reliability mechanisms
- Background keepers with PID/log tracking
- Rolling smoke reports for remote path health
- USB + network fallback routing policies
- Startup automation hooks for recovery/bridge re-establishment

---

## 7) Mobile UX Surfaces

### Main surfaces
- Mobile Console (PWA-capable)
- Mobile Approvals page
- Phone Mode dashboard (dual-screen/interactive patterns in desktop-hosted UI)

### Interaction behavior
- Status-first with explicit control arming for risky actions
- Recovery hooks exposed to reduce manual operator burden
- Designed to operate even when desktop UI is not actively foregrounded

---

## 8) Privacy/Safety Posture for Unknown Prompts

### Current strengths
- Authority and ACL controls are present.
- Approval lanes exist for high-risk actions.
- Output-policy and abstraction-first controls are documented and partially implemented.

### Gap to close (important)
- Outbound error/report payload sanitization is not yet guaranteed uniformly for all paths.
- Requirement for next phase:
  - strip secrets/string signatures/token-like material from error payloads by default
  - enforce this before any relay, push, webhook, or external sink sends content

Recommendation:
- Implement a centralized sanitizer middleware for all outbound operational messages.

---

## 9) Mobile Performance and Operations Notes

From current local runtime observations:
- Mobile control/tunnel/keeper status endpoints are present in health telemetry.
- Background tunnel monitor is active and writing rolling health reports.
- Phone bridge keeper health is trackable by API and log tails.

Operational implication:
- The architecture is already structured for persistent supervision, but should enforce stricter fail-closed behavior on degraded trust states.

---

## 10) Phase Plan (Mobile-Specific)

1. **Phase M1: Control Safety Baseline**
   - Central outbound redaction for all mobile-triggered notifications/errors
   - Fail-closed default when authority context is ambiguous
2. **Phase M2: Reliability Hardening**
   - Auto-remediation for keeper/tunnel failures
   - More explicit route-state diagnostics surfaced in mobile UI
3. **Phase M3: Governance Upgrade**
   - Mandatory policy assertion at startup
   - Egress deny-by-default for unknown channels
4. **Phase M4: Telemetry Intelligence**
   - Edge-based anomaly scoring over mobile action graph
   - Approval auto-escalation by risk class

---

## 11) Comparative Positioning (Mobile Plane)

Against generic model-only assistants:
- Asolaria mobile plane is stronger in device/ops control and operational continuity.
- Frontier model assistants are stronger in pure reasoning quality without orchestration overhead.

Best fit:
- Use frontier models for cognition.
- Use Asolaria mobile plane for trusted execution, control, and policy-governed automation.

---

## 12) Evidence Paths

- Runtime API implementation: `Asolaria/server.js`
- Mobile docs: `Asolaria/PHONE-URLS.md`, `Asolaria/README.md`
- Control-plane upgrade baseline: `Asolaria/reports/system-upgrade-loop-2026-02-19.md`
- Latest tunnel report path pattern: `Asolaria/reports/phone-tunnel-smoke-latest.md`

---

## 13) Sanitization Declaration

This mobile card omits:
- auth tokens, query token values, API keys, passwords
- private tunnel URLs and identity-bearing data
- any direct credentials or secret-bearing diagnostics


