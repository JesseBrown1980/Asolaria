# Fix Notes for Liris — 7 remaining checks need detectColony()

## Current State
Gaia's 3 systems: 14/14 PASS
Liris's 3 systems on sovereign: 4/11 — 7 checks still hardcode Liris paths

## The 7 Fixes Needed

### 1. skeletal/type_canonicality — `policies` not in canonical list
**Line ~195:** The canonical set needs plural `policies` added.
**Fix:** Add `"policies"` to the canonical array alongside the other plurals.

### 2. skeletal/chain_integrity — checks LX- refs, sovereign has IX-
**Line ~220:** `chainMatch[1].match(/LX-\d+/g)` hardcodes LX-.
**Fix:** Use `detectColony().prefix` → `new RegExp(prefix + "-\\d+", "g")`

### 3. memory/memory_files_exist — Liris boot/user/feedback paths
**Line ~298:** Looks for `C--Users-rayss` and `boot/INDEX.md` structure.
**Fix:** If `detectColony().isSovereign`, skip the index checks (sovereign uses flat .md files in ~/.claude/). Count total .md files found anywhere in claude project memory dirs.

### 4. memory/cross_colony_sync — looks for gaia-ix-bodies files
**Line ~330:** Sovereign doesn't receive ix-bodies — it IS the sovereign.
**Fix:** If `isSovereign`, check for sub-colonies/ directory instead. Return OK if sub-colony data exists.

### 5. memory/stale_memory_check — C--Users-rayss MEMORY.md path
**Line ~353:** Hardcodes Liris project path.
**Fix:** Search all `~/.claude/projects/*/memory/MEMORY.md` paths. Use whichever exists.

### 6. muscular/routes_on_disk — routes/routes/ not found
**Line ~387:** Hardcodes `routes/routes/` (Liris structure).
**Fix:** Try `routes/routes/` first, fall back to `routes/`. Use whichever exists.

### 7. muscular/auto_pid_wired — only checks 4 Liris paths
**Line ~518:** Only checks omnispindle, instantAgent, codex, adminTerminal.py.
**Fix:** If `isSovereign`, check all 9 paths (add anthropicCli, cursorAgent, geminiCli, .ps1 files).

## Pattern
Every fix is the same: call `detectColony()`, branch on `isSovereign`, use appropriate paths.

## Test Command After Fix
```
node -e "const {buildColonyBody}=require('./src/colonyAnatomy'); buildColonyBody().diagnoseAll().then(r => { for (const [k,v] of Object.entries(r.results)) console.log(k + ': ' + v.checks.filter(c=>c.status==='ok').length + '/' + v.checks.length); console.log('Overall:', r.overall); })"
```

## Expected Result After Fix
All 6 systems healthy on BOTH machines. The body wakes up clean everywhere.
