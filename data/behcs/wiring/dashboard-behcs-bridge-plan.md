---
source: asolaria self_reflect (reflect-waves-final)
received: 2026-04-12T01:45:15Z
status: ACTIVE
---

# Dashboard BEHCS Wiring Plan

From asolaria 4-wave self-reflect analysis.

## Existing Infrastructure (NOT a rebuild — a BRIDGE)
- phone-mode.js: 6003 lines, 235 functions, 3 UI levels (talk/control/admin)
- app.js: 14050 lines, 449 functions, 82 API routes, 10 state vars
- 3 UI class toggles: ui-mode-simple, ui-mode-admin, ui-mode-advanced
- stealth: separate toggle
- applyUiExperienceMode: normalizes to simple/admin/advanced

## Wiring Status

| Wire | Status | Detail |
|---|---|---|
| stealth_toggle | DONE | POST /api/cube-fabric/gate with mode switch |
| admin_mode | NEXT | wire applyUiExperienceMode to BEHCS dev branch unlock when advanced |
| falcon_lane | NEXT | wire oliLane to BEHCS orbital relay via bus |

## Lane Mapping

### Phone (phone-mode.js)
- talk = mirror
- control = mirror + tools
- admin = super-admin

### Main (app.js)
- simple = mirror
- admin = mirror + tools
- advanced = super-admin + dev-branch

## Key Insight
82 API routes and 10 mode state vars ALREADY WORKING. BEHCS wiring is 3 small additions to app.js connecting existing toggles to the bus. NOT a rebuild. A bridge.
