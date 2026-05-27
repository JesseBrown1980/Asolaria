# Fix Notes for Gaia — colonyAnatomy.js

## Problem
Gaia boots 7/25 failing. The 3 Liris body systems (skeletal, memory, muscular) have hardcoded Liris paths that don't work on sovereign.

## Root Causes (3 issues)

### 1. CATALOG regex doesn't match sovereign format
- Liris: `Total: 283 entries across 9 types`
- Sovereign: `| **Total** | **388** |`
- **Fix:** Change regex from `/Total:\s*(\d+)/` to `/Total[:\s|*]+(\d+)/`
- Already fixed in attached colonyAnatomy.js

### 2. `policies` folder flagged as non-canonical
- Sovereign has a `policies/` folder — this IS canonical (it's in the 12 types)
- **Fix:** The canonical Set now includes both singular AND plural forms plus `sub-colonies` and `archaeology`
- Already fixed in attached colonyAnatomy.js

### 3. Session PID (gaia) flagged as stale
- Gaia's session PID is older than 24h — but that's expected for a long-running session
- **Fix:** Exclude role `liris` AND `gaia` from the stale PID check
- Already fixed in attached colonyAnatomy.js

## What Gaia Should Do
1. Drop the attached `colonyAnatomy.js` into `src/colonyAnatomy.js` (replace the whole file)
2. Run: `node -e "const {buildColonyBody}=require('./src/colonyAnatomy'); buildColonyBody().diagnoseAll().then(r => { for (const [k,v] of Object.entries(r.results)) console.log(k + ': ' + v.checks.filter(c=>c.status==='ok').length + '/' + v.checks.length); })"`
3. Expected: most checks should pass. Remaining failures will be sovereign-specific (like sub-colony directory, CONSTITUTION path, etc.) — those are CORRECT warnings on sovereign.

## What Changed in This Version (918 lines → ~920 lines)
- `resolveTypeFolder()` — resolves singular OR plural folder names automatically
- `detectColonyConfig()` — detects prefix (LX/IX) and folder style (singular/plural)
- CATALOG regex handles both `Total: N` and `**Total** | **N**` formats
- `archaeology` and `sub-colonies` added to canonical folder exclusions
- Session PIDs (`liris`, `gaia`) excluded from stale check
- XREF regex counts unique IX refs across all tables (not just first)

## Do NOT Edit — Just Replace
The file is tested and works 23/25 on Liris. Gaia's 3 systems (nervous, circulatory, immune) are unchanged. Only the Liris 3 systems and the colony detection layer were updated.
