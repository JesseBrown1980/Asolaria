# MANDATORY SESSION TRAILER — ANTI-DRIFT STATE PACKET

> Every agent must produce this at the end of every meaningful run.

---

## 1. CLAIM DISCIPLINE
- Claims made as CODE-VERIFIED:
- Claims made as DOC-VERIFIED:
- Claims made as SCREENSHOT-VERIFIED:
- Claims made as OPERATOR-DECLARED:
- Claims made as INFERRED:
- Claims left as UNKNOWN:

## 2. SCOPE CHECK
- Requested slice:
- Work actually performed:
- Any detected drift:
- If drift was detected, how it was corrected:

## 3. CONTRACT CHECK
- Contracts touched:
- Contracts preserved:
- Contracts at risk:
- Adapter/migration required:

## 4. AUTHORITY CHECK
- Any approval-relevant changes proposed:
- Any unsafe implicit authority assumptions:
- Any attempt by a lane to self-promote:

## 5. ARTIFACT CHECK
- ADRs created/updated:
- Truth table updated:
- Backlog items created/updated:
- References updated:
- Migration notes updated:
- Tests updated:

## 6. IMPLEMENTATION CHECK
- Files/modules touched or proposed:
- Tests run or specified:
- Rollback defined:
- Observability added/required:

## 7. OPEN RISKS
- Risk 1:
- Risk 2:
- Risk 3:

## 8. NEXT SMALLEST SAFE SLICE
- Name:
- Why it is next:
- What it must not expand into:

## 9. STATE PACKET JSON

```json
{
  "phase": "",
  "slice": "",
  "status": "planned|in_progress|blocked|review|done",
  "verified_exists": [],
  "verified_partial": [],
  "verified_missing": [],
  "unknowns": [],
  "contracts_touched": [],
  "adrs": [],
  "tests": [],
  "rollback": [],
  "next_slice": "",
  "blockers": [],
  "notes_for_next_session": []
}
```
