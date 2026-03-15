# Read-Only Research Sweep

- Started: 2026-03-12T05:00:59.4599848-03:00
- Deadline: 2026-03-12T09:00:59.4388936-03:00
- Packet: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\packet.md
- Run JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\run.json

## Lanes

### openai-web-chat

- Kind: browser-chat
- Route: /api/integrations/openai_web_chat/chat
- Status: failed
- Job ID: job_1773302461498_olzhxd
- Error: Step 1 type text is too long.
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\openai-web-chat\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\openai-web-chat\result.json

### gemini-enterprise-web

- Kind: browser-chat
- Route: /api/integrations/gemini_enterprise_web/chat
- Status: failed
- Job ID: job_1773302461531_e0kpth
- Error: Step 1 type text is too long.
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\gemini-enterprise-web\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\gemini-enterprise-web\result.json

### openai-gpt5

- Kind: openai-locked
- Route: /api/providers/openai/run
- Status: completed
- Job ID: job_1773302461542_5f3iyo
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\openai-gpt5\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\openai-gpt5\result.json

```text
**Executive summary**
- The cockpit endpoints and sidecars are healthy; the “No admin terminals registered yet.” banner is a frontend placeholder shown before the first fetch completes, not evidence of missing terminals. See initial empty render then async fetch, public/app.js:9905 and public/app.js:9935–9950.
- The remaining instability is dominated by transport/runtime pressure from aggressive polling plus a very short server cache TTL. The UI polls the cockpit every 1.5s while the server TTL is also 1.5s, causing constant recomputation and file reads. See server.js:10030 (TTL = 1500) and public/app.js:13649 (pollers).
- Gateway authority/audit panels call a secondary “gatewayControl” service that can be slow or unavailable (token required). Background polling attempts to autostart or reach it, producing intermittent errors. See resolveGatewayControlRuntime token requirement, server.js:3866, and gateway routes using callGatewayControlApi, server.js:32858–33014, 4142–4207.
- Profiles load correctly and enumerate sidecar paths; there is no server-side permission gate tied to profile abilities for cockpit routes (only loopback gating). See cockpit routes guarded by requireLoopbackOnly, server.js:22007–22074.

**Ranked root causes**
- P0: Frontend placeholder/race renders “No admin terminals registered yet.” before async snapshot arrives. public/app.js:9905–9915, 9935–9950.
- P0: Over‑eager polling with matching 1.5s UI interval and 1.5s server TTL thrashes the cockpit snapshot and log tail reads. server.js:10030; public/app.js:13649.
- P1: Gateway audit/authority panel polls even when not in use, hitting a service that may be down or missing token, yielding intermittent 502/503 and console noise. server.js:3866, 32858–33014; public/app.js:10059–10097, 13626, 13649.
- P2: General background polling density (health 2.5–7s, cockpit 1.5s, gateway 20s, threads/tasks/memory 12–20s) contributes to load and occasional sluggishness. public/app.js:13638–13649, 10059–10077 and nearby intervals.

**Why profile permissions are or are not central**
- Cockpit visibility/interaction does not check profile “abilities”; endpoints enforce loopback only, not profile-based authorization. server.js:22007–22074.
- Profiles resolve sidecar runtime paths and labels; those are present and the sidecars are running with updated status files (helm/sentinel). runtime/admin-terminals/helm/status.json and runtime/admin-terminals/sentinel/status.json.
- “Public mode” can block cockpit routes, but your instance is not in that mode (the cockpit responds). The public block list simply enumerates what would be blocked if enabled. server.js:2718–2737.
- Observed issues align with polling/transport and gateway control availability, not with missing “abilities” in profiles.

**Read-only validation plan**
- Confirm cockpit cache/poll timing: verify ADMIN_TERMINAL_COCKPIT_TTL_MS = 1500 (server.js:10030) and cockpit poll interval = 1500ms (public/app.js:13649).
```

### openai-gpt52

- Kind: openai-locked
- Route: /api/providers/openai/run
- Status: completed
- Job ID: job_1773302463837_svwa5i
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\openai-gpt52\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\openai-gpt52\result.json

```text
1. `Executive summary`
- Yes—this looks fixable, and the strongest evidence points to **transport/runtime + frontend polling/initialization** as the primary drivers of the remaining cockpit instability, not profile permissions.
- Helm is demonstrably receiving and processing dashboard prompts (`Prompt queued…`, `ACTIVE`, `lastInputSource = "Asolaria Dashboard"`, `inboxLinesProcessed > 0`), which is the exact path that would typically fail first if profile loading/permissions were the core blocker.
- The remaining issues (“No admin terminals registered yet” flicker, noisy console errors, degraded gateway authority/audit routes, server slowdown under load) match a pattern of **race conditions + aggressive polling + expensive/unstable endpoints** rather than identity metadata misconfiguration.

2. `Ranked root causes`
1) **Frontend state/race + “empty” rendering bug**: UI shows `No admin terminals registered yet.` before the first successful discovery fetch (or on transient fetch failures), then “fixes” after refresh—classic “initial fetch not completed but rendered as empty” behavior.  
2) **Over-aggressive background polling (and lack of backoff)**: frequent polling amplifies transient 404/500/timeouts into console noise and can create self-inflicted load that worsens the slowdowns.  
3) **Backend discovery/registration non-determinism**: the server likely depends on async discovery (status files, sidecar heartbeats, or delayed initialization). Until that completes—or if a single poll hits during a slow FS read—the cockpit endpoint can temporarily report no terminals.  
4) **Gateway authority/audit endpoints doing slow/fragile work inline**: these routes being “unstable or degraded” suggests blocking calls, missing timeouts, or exception paths that surface as intermittent failures (and then cascade via polling).  
5) **Error handling gaps (both sides)**: unhandled promise rejections/JSON parse errors/partial reads of `status.json` can manifest as intermittent failures that disappear on refresh.

3. `Why profile permissions are or are not central`
- **Not central given current evidence**:
  - Helm successfully accepts dashboard prompts without restart, and its runtime `status.json` reflects dashboard input processing. If profile loading or profile permission gating were the main cause, you’d expect **consistent** inability to accept prompts, consistent auth failures, or sidecar refusal to act—not “works but flickers/noisy/unreliable under polling.”
  - The symptom “No admin terminals registered yet” resolving on refresh is much more consistent with **UI/render timing** or **backend discovery timing** than with permissions (permissions failures don’t typically fix themselves with a refresh).
- **Where profile/identity could still matter (secondary)**:
  - If “gateway authority/audit status” requires a capability/identity mapping distinct from the cockpit prompt path, it could be failing due to *ability metadata* mismatches or a separate *authorization gate*. But that would explain those specific degraded routes—not the cockpit registration flicker nor the server slowdowns.
- Practical discriminator: permissions issues usually produce **stable, repeatable 401/403/denied** outcomes; your reported outcomes are **intermittent and load-sensitive**, which points away from permissions as the primary root cause.

```

### cursor

- Kind: external-provider
- Route: /api/providers/external/run
- Status: completed
- Job ID: job_1773302464063_eq33qt
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\cursor\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\cursor\result.json

```text
antigravity unavailable. Passed without execution (antigravity API 429: You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.).
```

### antigravity

- Kind: external-provider
- Route: /api/providers/external/run
- Status: completed
- Job ID: job_1773302464338_hdx8pc
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\antigravity\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\antigravity\result.json

```text
antigravity unavailable. Passed without execution (antigravity API 429: You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.).
```

### anthropic-cli

- Kind: external-provider
- Route: /api/providers/external/run
- Status: completed
- Job ID: job_1773302464363_s6ond4
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\anthropic-cli\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-050059-cockpit-diagnosis\anthropic-cli\result.json

```text
antigravity unavailable. Passed without execution (antigravity API 429: You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.).
```
