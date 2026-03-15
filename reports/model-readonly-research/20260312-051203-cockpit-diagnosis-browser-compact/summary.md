# Read-Only Research Sweep

- Started: 2026-03-12T05:12:03.7857927-03:00
- Deadline: 2026-03-12T09:12:03.7683045-03:00
- Packet: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\packet.md
- Run JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\run.json

## Lanes

### openai-web-chat

- Kind: browser-chat
- Route: /api/integrations/openai_web_chat/chat
- Status: failed
- Job ID: job_1773303126693_zsfv7l
- Error: Failed to launch Chrome persistent profile context. userDataDir="C:\Users\acer\AppData\Local\Google\Chrome\User Data", profileDirectory="Default", reason="browserType.launchPersistentContext: Target page, context or browser has been closed
Browser logs:

<launching> C:\Program Files\Google\Chrome\Application\chrome.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --enable-automation --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --no-first-run --no-default-browser-check --disable-translate --disable-features=Translate,TranslateUI --profile-directory=Default --user-data-dir=C:\Users\acer\AppData\Local\Google\Chrome\User Data --remote-debugging-pipe about:blank
<launched> pid=12128
Call log:
[2m  - <launching> C:\Program Files\Google\Chrome\Application\chrome.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --enable-automation --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --no-first-run --no-default-browser-check --disable-translate --disable-features=Translate,TranslateUI --profile-directory=Default --user-data-dir=C:\Users\acer\AppData\Local\Google\Chrome\User Data --remote-debugging-pipe about:blank[22m
[2m  - <launched> pid=12128[22m
[2m  - [pid=12128] <gracefully close start>[22m
[2m  - [pid=12128] <kill>[22m
[2m  - [pid=12128] <will force kill>[22m
[2m  - [pid=12128] taskkill stderr: ERRO: o processo "12128" não foi encontrado.[22m
[2m  - [pid=12128] <process did exit: exitCode=21, signal=null>[22m
[2m  - [pid=12128] starting temporary directories cleanup[22m
[2m  - [pid=12128] finished temporary directories cleanup[22m
[2m  - [pid=12128] <gracefully close end>[22m
".
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\openai-web-chat\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\openai-web-chat\result.json

### gemini-enterprise-web

- Kind: browser-chat
- Route: /api/integrations/gemini_enterprise_web/chat
- Status: failed
- Job ID: job_1773303138299_hblabv
- Error: Failed to launch Chrome persistent profile context. userDataDir="C:\Users\acer\AppData\Local\Google\Chrome\User Data", profileDirectory="Profile 3", reason="browserType.launchPersistentContext: Target page, context or browser has been closed
Browser logs:

<launching> C:\Program Files\Google\Chrome\Application\chrome.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --enable-automation --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --no-first-run --no-default-browser-check --disable-translate --disable-features=Translate,TranslateUI --profile-directory=Profile 3 --user-data-dir=C:\Users\acer\AppData\Local\Google\Chrome\User Data --remote-debugging-pipe about:blank
<launched> pid=24052
Call log:
[2m  - <launching> C:\Program Files\Google\Chrome\Application\chrome.exe --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --enable-automation --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --no-first-run --no-default-browser-check --disable-translate --disable-features=Translate,TranslateUI --profile-directory=Profile 3 --user-data-dir=C:\Users\acer\AppData\Local\Google\Chrome\User Data --remote-debugging-pipe about:blank[22m
[2m  - <launched> pid=24052[22m
[2m  - [pid=24052] <gracefully close start>[22m
[2m  - [pid=24052] <kill>[22m
[2m  - [pid=24052] <will force kill>[22m
[2m  - [pid=24052] taskkill stderr: ERRO: o processo "24052" não foi encontrado.[22m
[2m  - [pid=24052] <process did exit: exitCode=21, signal=null>[22m
[2m  - [pid=24052] starting temporary directories cleanup[22m
[2m  - [pid=24052] finished temporary directories cleanup[22m
[2m  - [pid=24052] <gracefully close end>[22m
".
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\gemini-enterprise-web\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\gemini-enterprise-web\result.json

### openai-gpt5

- Kind: openai-locked
- Route: /api/providers/openai/run
- Status: completed
- Job ID: job_1773303141814_p30hgt
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\openai-gpt5\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\openai-gpt5\result.json

```text
**Executive summary**
- Yes, it’s fixable. The remaining cockpit issues stem primarily from transport/runtime and frontend polling behavior, not from profile loading or profile permissions.
- Evidence shows: terminals are discovered from a local registry and render correctly after refresh; dashboard prompts reach Helm; loopback/API gates and “public profile” guards exist but are not what’s tripping the cockpit in this run.
- The biggest sources of instability are: tight polling cadences that align with server cache TTLs, heavy/slow gateway-control routes with multi‑second auto-start and timeouts, and an initial UI placeholder that briefly claims “No admin terminals…” before the first fetch completes.

**Ranked root causes**
- Polling/TTL thrash on cockpit and health
  - Cockpit GET is polled every 1.5s in the UI while the server snapshot cache TTL is also 1.5s, creating constant regeneration at the boundary and occasional races/loading flicker. public/app.js:13638, server.js:10030.
  - Health is polled frequently from many places (multiple setIntervals and ad‑hoc calls), amplifying server load in bursts. public/app.js:13579→13660 and many call sites listed by Select-String.
- Slow/fragile gateway control paths
  - Gateway endpoints synchronously ensure/start the control process (wait up to 9s) and then fetch with a 7s timeout; under load or if the control process is cold, UI sees 502/503/504 and logs frequent errors. server.js:4142, server.js:32858, server.js:32975, server.js:32987.
- First-render UX placeholder
  - The UI renders “No admin terminals registered yet.” before the first cockpit fetch completes; a background refresh usually corrects it, leading to transient confusion. public/app.js:9914, 13579→13638.
- Not primary: profile/permissions
  - Terminal discovery uses a local identities registry + profile JSON; nothing here actively blocks cockpit rendering or prompting in this environment. server.js:12980, 12984; registry and profiles exist and are read.
- Secondary contributors (lower impact)
  - Prompt delivery wait is short (2.5s), so under I/O or process lag the UI can report transient prompt failures even though delivery succeeds moments later. server.js:13604 (timeoutMs: 2500).

**Why profile permissions are or are not central**
- Not central:
```

### openai-gpt52

- Kind: openai-locked
- Route: /api/providers/openai/run
- Status: completed
- Job ID: job_1773303145770_8pq5rv
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\openai-gpt52\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\openai-gpt52\result.json

```text
1. `Executive summary`
- Yes, it’s fixable. The remaining instability is dominated by frontend polling/UX behavior and backend dependency/runtime load—not by profile permissions.
- The “No admin terminals registered yet.” flicker is currently *expected* on startup because `public/app.js` explicitly renders an empty cockpit first, then polls (`renderAdminTerminalCockpit({ terminals: [] ... })` on load; then `setInterval(...refreshAdminTerminalCockpit..., 1500)`).
- Prompting is already working end-to-end (dashboard → server → sidecar inbox → `status.json` update), which strongly points away from profile permission failures as the primary blocker.

2. `Ranked root causes`
1) Frontend refresh strategy (high confidence): aggressive background polling + “empty first render” UX + conditional polling (`document.hidden` / `uiExperienceMode`) makes the cockpit look unregistered transiently and amplifies error noise.  
2) Gateway transport/dependency instability (high confidence): the dashboard polls `/api/gateway/authority/status` and `/api/gateway/audit/status`, which proxy to `callGatewayControlApi(...)`; if the gateway control service is down/unreachable, these will reliably throw 502/403 and spam console/UI.  
3) Backend cockpit snapshot cost under scale (medium confidence): cockpit snapshot work is small now (2 terminals), but it includes `countPendingInboxMessages()` which reads and splits the entire inbox file each snapshot; combined with `ADMIN_TERMINAL_COCKPIT_TTL_MS = 1500` and UI polling every 1500ms, this can become a measurable load as inbox files grow or tabs multiply.  
4) Profile loading edge cases (low confidence): profiles/registry are read from disk; intermittent empty lists would require transient JSON read/parse failures or concurrent writes. Nothing in the current evidence suggests this is happening.

3. `Why profile permissions are or are not central`
- Not central because the critical path that would fail under profile permission problems is already working: the cockpit can list Helm/Sentinel, queue prompts, and Helm’s `runtime/admin-terminals/helm/status.json` records `lastInputSource = "Asolaria Dashboard"` and increments `inboxLinesProcessed`.  
- The cockpit list comes from `admin-terminal-identities.json` + profile JSON reads in `server.js:getAdminTerminalDefs()`. If permissions were the main issue, you’d expect *persistent* inability to enumerate terminals (not a temporary “until refresh” flicker) and/or consistent failure to locate sidecar paths.  
- Where “permissions” *can* matter is loopback/API gating (`requireLoopbackOnly` / `isLoopbackRequest`) and filesystem reads, but the observed successful loopback responses (`/api/health`, `/api/admin-terminals/cockpit`) argue against those being the primary remaining cause.

4. `Read-only validation plan`
- Cockpit flicker classification: confirm whether “No admin terminals registered yet.” occurs only before the first successful `/api/admin-terminals/cockpit` response (startup empty render), vs. occurring after successful snapshots (server returning `terminals: []`).  
- Polling pressure audit: in browser DevTools Network, count concurrent repeating requests (notably `/api/admin-terminals/cockpit`, `/api/health`, gateway status routes) and correlate spikes with UI slowdowns.  
- Gateway dependency check: observe whether `/api/gateway/authority/status` and `/api/gateway/audit/status` are returning 502 (gateway service unreachable) vs 403 (loopback gate) vs valid payload; this distinguishes “downstream transport” from “auth gate.”  
```

### cursor

- Kind: external-provider
- Route: /api/providers/external/run
- Status: completed
- Job ID: job_1773303146640_xfl772
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\cursor\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\cursor\result.json

```text
antigravity unavailable. Passed without execution (antigravity API 429: You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.).
```

### antigravity

- Kind: external-provider
- Route: /api/providers/external/run
- Status: completed
- Job ID: job_1773303146841_ay1ap3
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\antigravity\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\antigravity\result.json

```text
antigravity unavailable. Passed without execution (antigravity API 429: You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.).
```

### anthropic-cli

- Kind: external-provider
- Route: /api/providers/external/run
- Status: completed
- Job ID: job_1773303147077_pqh4vh
- Preview: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\anthropic-cli\preview.txt
- Result JSON: C:\Users\acer\Asolaria\reports\model-readonly-research\20260312-051203-cockpit-diagnosis-browser-compact\anthropic-cli\result.json

```text
antigravity unavailable. Passed without execution (antigravity API 429: You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.).
```
