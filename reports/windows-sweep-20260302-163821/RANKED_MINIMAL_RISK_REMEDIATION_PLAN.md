# Ranked Minimal-Risk Remediation Plan (No Changes Applied)

## Priority 1 - Contain external startup surface (`AgentBridgePC`)
- Why ranked first: startup command binds `0.0.0.0:8765` and passes `-SharedToken "change_me"` from HKCU Run; this is the highest practical exposure signal in current findings.
- Minimal-risk action set (when approved):
  1. Export current Run key value as backup.
  2. Change bind host to loopback (`127.0.0.1`) unless external access is explicitly required.
  3. Replace placeholder token with a strong random secret.
  4. Verify service health locally only.
- Rollback: restore exported Run value.

## Priority 2 - Remove duplicate Asolaria auto-start pathways
- Why ranked second: both scheduled tasks `\Asolaria Core Boot Startup` and `\Asolaria One Button Startup` are logon-triggered, and startup folder also includes `Asolaria One Button Startup.lnk`.
- Observed impact: potential duplicate launches/race conditions; both logon tasks report last result `1`.
- Minimal-risk action set (when approved):
  1. Keep one canonical startup method.
  2. Disable (not delete) extra startup entries first.
  3. Reboot/login once and confirm single runtime ownership on port `4781`.
- Rollback: re-enable disabled entries.

## Priority 3 - Stabilize Python resolution order
- Why ranked third: `python` resolves to 3 targets (WindowsApps 3.13.12, Python313 3.13.2, Anaconda 3.12.7), which can silently switch environments.
- Minimal-risk action set (when approved):
  1. Keep `py.exe` launcher as canonical interactive selector.
  2. Reorder PATH so desired Python precedes WindowsApps shims.
  3. Keep alternative runtime via explicit full path / virtual environments.
- Rollback: restore original PATH export.

## Priority 4 - Align Java toolchain (`JAVA_HOME` vs PATH)
- Why ranked fourth: PATH prefers JDK 21 while `JAVA_HOME` points to JDK 8 (`C:\Java\jdk1.8.0_392`).
- Minimal-risk action set (when approved):
  1. Decide canonical JDK per workload (runtime/build).
  2. Align `JAVA_HOME` with selected default.
  3. Keep secondary JDK available via explicit path/tool config.
- Rollback: restore original `JAVA_HOME` and PATH order.

## Priority 5 - PATH hygiene cleanup
- Why ranked fifth: duplicate core entries (5) and stale entries (2 missing):
  - `C:\Users\acer\AppData\Local\Programs\Windsurf\bin`
  - `C:\Users\acer\.dotnet\tools`
- Minimal-risk action set (when approved):
  1. Export PATH.
  2. Remove exact duplicate entries.
  3. Remove stale entries only if tool no longer needed.
- Rollback: import saved PATH snapshot.

## Priority 6 - Search/indexer stability follow-up
- Why ranked sixth: service is running and DB files (`Windows.db`, `Windows-gather.db`) are present, but Application log has 34 warnings (event id 10024) in 7 days for non-responsive filter hosts.
- Minimal-risk action set (when approved):
  1. Identify file types/providers causing filter-host timeouts.
  2. Exclude problematic volatile folders from indexing first (non-destructive).
  3. Rebuild index only if warnings persist after scope tuning.
- Rollback: revert indexing scope; rebuild can be repeated safely.

## Priority 7 - Optional deeper C/D duplicate-content audit
- Why optional: current scoped binary scan found zero hash-verified duplicates across selected roots; full-drive hashing is heavier and not currently justified by findings.
- Minimal-risk action set (when approved):
  1. Run staged hash scan by high-value folders (installers, archives, media).
  2. Quarantine candidate duplicates before any deletion.
- Rollback: retain quarantine; no destructive step required.

## Gating Rule
- Execute in this order only after explicit owner approval for mutation steps.
- For each step: backup -> single change -> verification -> checkpoint note.
