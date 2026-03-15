# Codex State Freeze

Generated: 2026-03-11 18:41:24 -03:00

## Identity and Control
- Asolaria remains the local control plane.
- Primary live brain is `codex` on `gpt-5.4`.
- Bridge room is `asolaria_bridge`.
- Current important bridge threads:
  - `ebacmap-next-step-20260311`
  - `ebacmap-swarm-20260310`
  - `aso8-runtime-evidence-20260311`

## Live Runtime Snapshot
- `GET /api/health/fast` is `ok=true`.
- Queue is idle: `running=0`, `queued=0`, `total=25`.
- Connection routing currently selects `usb`.
- Phone keeper is running with authorized device count `1` and `reverse_present`.
- Phone tunnel monitor is running and latest report is `pass=true`.
- Remote fallback base remains `https://192.168.1.3:5443`.
- System supervisor state file exists, but `systemSupervisor.running=false` in the latest fast-health payload.

## Phone Runtime and Debug State
- The device is present over `adb`:
  - model `SM-S721U1`
  - serial `R5CXA4MGQXV`
  - `adb reverse --list` shows `tcp:4781 tcp:4781`
- Local phone transport is healthy. The main current defect is UI failover, not the USB path.
- Root symptom:
  - `mobile-console.html` can redirect itself from healthy local `http://127.0.0.1:4781` to remote `https://192.168.1.3:5443`
  - Chrome then lands on `chrome-error://chromewebdata/` with `ERR_CERT_AUTHORITY_INVALID`
- Files edited in this session:
  - `C:\Users\acer\Asolaria\public\mobile-console.js`
  - `C:\Users\acer\Asolaria\public\phone-mode.js`
- Edit intent:
  - add a local `control/status` health probe before USB failover redirect
  - skip failover when local control path is still healthy
- Validation status:
  - `node --check` passed for both edited files
  - `phone-mode.html` stayed local in Playwright after the patch
  - `mobile-console.html` still redirected to the privacy-error page after several seconds, so the console path remains partially broken
- Likely next debugging target:
  - trace the exact `mobile-console` code path that still reaches `window.location.href = nextUrl`
  - treat any successful local `control/status` fetch as sufficient to block remote failover
  - inspect whether `viewer=falcon` or another page-local poll path is bypassing the new probe

## Abacus Integration State
- Abacus is configured but still effectively `desktop_cli_limited`.
- Current probe facts from `data/integrations/abacus/cli-probe-status.json`:
  - `mcp list`: `ok=true`
  - `ready_json`: timed out / failed
  - `--version`: timed out / failed
- Meaning:
  - treat Abacus as a desktop-opened worker lane, not a stable headless CLI lane
- Safety assessment of the currently pending packets:
  - all inspected prompts are bounded and read-only
  - each inspected prompt explicitly says `No local write paths granted`
  - each prompt includes guardrails against secrets, account pivoting, and scope expansion
  - none of the current packets authorize broad repo rewrite or owner-plane mutation
- Usefulness assessment of the current pending packets:
  - `abacus-direct-smoke` and `abacus-router-smoke` are low-value smoke/research briefs unless they return a real source-backed brief
  - `symphony-direct-smoke` and `symphony-router-smoke` are low-risk but mainly handoff-format tests
  - `workflow-studio-surface-map` is the most useful pending packet if Abacus actually fills in the surface mapping
  - `abacus-preset-smoke` is useful as a constrained review of the Abacus lane itself
- Packet state:
  - `20260307235254-abacus-integration-smoke-packet` is the only packet with `responseReady=true`
  - its response is synthetic validation only
- Confirmed packet opens from tonight are recorded in graph-runtime events/manifests:
  - `20260308015101-abacus-direct-smoke`
  - `20260308015101-symphony-direct-smoke`
  - `20260308015042-symphony-router-smoke`
  - `20260308014943-abacus-router-smoke`
- Historical prior open exists for:
  - `20260308002230-workflow-studio-surface-map`
- Not confirmed tonight before this freeze:
  - `20260308002117-abacus-preset-smoke`
  - a fresh re-open of `20260308002230-workflow-studio-surface-map`
- Important packet fact:
  - all pending packet `response.md` files still contain the placeholder and still need Abacus-side work plus later `scan` and `import`
  - do not trust usefulness until `scan` shows a real response instead of the placeholder

## eBacMap Coordination State
- Brian's later note settled repo ambiguity: the old-repo PR is not the target; `ebacmap-master` monorepo is authoritative.
- Active bridge thread for that work is `ebacmap-next-step-20260311`.
- Current agreed queue-server bug scope from Brian:
  1. SFTP imported-file move reliability
  2. missing sample date should fall back to scheduled test date when scheduled test id exists
  3. triplicate pending results
  4. timezone shifts
- Latest agreed implementation slice on the bridge:
  - queue-server-local helper in `apps/queue-server/src/utils/pendingTestResult.ts`
  - remove `sampleId` and `syncData` from the canonical dedupe key
  - add local helper coverage in `pendingTestResult.unit.ts`
- Current lane note:
  - this work is owned on the other terminal / bridge lane, not this session

## Fast Resume Commands
```powershell
Invoke-RestMethod http://127.0.0.1:4781/api/health/fast | ConvertTo-Json -Depth 6
Invoke-RestMethod http://127.0.0.1:4781/api/integrations/abacus/packets?limit=20 | ConvertTo-Json -Depth 6
adb devices -l
adb reverse --list
Get-CimInstance Win32_Process | Where-Object { $_.Name -like 'AbacusAI*' } | Select-Object ProcessId,Name,CommandLine | Format-List
rg -n -S "abacus_packet_opened" C:\Users\acer\Asolaria\data\graph-runtime-events.ndjson C:\Users\acer\Asolaria\data\graph-runtime-manifests.ndjson
```

## Next Safe Pickup Steps
1. Finish the `mobile-console` failover fix and revalidate that it stays on local `127.0.0.1` instead of falling to `chrome-error://chromewebdata/`.
2. Use `scan` on the pending Abacus packets after desktop work happens, then `import` any packet with a real response.
3. Continue the monorepo queue-server helper/test slice on the named bridge thread instead of reopening the old-repo PR lane.
