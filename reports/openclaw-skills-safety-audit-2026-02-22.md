# OpenClaw Skills Safety Audit (2026-02-22)

## Scope
- Host: `C:\Users\acer`
- OpenClaw CLI and bundled skills
- OpenManus prompt/tool code surfaces (high-risk execution primitives)
- Goal: identify safe integration candidates for desktop screen/tab capture and analysis

## Inventory
- `openclaw skills list --json`
  - Total skills: `49`
  - Eligible on this host: `6`
    - `coding-agent`
    - `gemini`
    - `healthcheck`
    - `session-logs`
    - `skill-creator`
    - `weather`

## Findings
1. No hidden "activation phrase" or covert callback trigger found in reviewed eligible skill markdown or OpenManus prompt files.
2. Main risk is capability risk, not hidden-text risk:
   - `coding-agent` recommends unrestricted execution patterns (`--yolo`, background interactive shells).
   - OpenManus includes direct execution tools:
     - `OpenManus/app/tool/bash.py`
     - `OpenManus/app/tool/run.py`
     - `OpenManus/app/tool/python_execute.py`
     - `OpenManus/app/tool/browser_use_tool.py`
3. External links in eligible skills are normal documentation/service links (Gemini, wttr.in, Open-Meteo, GitHub examples), not covert endpoints.
4. No user-installed managed OpenClaw skills found in `C:\Users\acer\.openclaw\skills` (path missing).

## Plugin posture (OpenClaw)
- `openclaw plugins list --json`
  - Total plugins: `36`
  - Enabled: `5` (`device-pair`, `memory-core`, `phone-control`, `talk-voice`, `telegram`)
  - Disabled: `31`
- Note: enabled channel plugins should be treated as data egress surfaces and reviewed separately before broad automation.

## Integration decision
- Rejected for direct automation by default:
  - `coding-agent` (high-risk shell/process control)
  - `healthcheck` (state-changing host hardening workflows)
- Allowed for controlled usage:
  - `session-logs` (read-only local analysis)
  - `skill-creator` (authoring guidance)
  - `weather` and `gemini` only when explicitly requested and policy-approved

## Implemented integration in Asolaria
- Added safe dual-capture execution path for UI analysis:
  - `Asolaria/src/skillRunner.js`
    - New action: `desktop_dual_capture`
    - Supports runtime overrides from skill input (`windowId`, `windowTitle`, `tag`, `skipPerScreen`, `includeVirtualDesktop`, `timeoutMs`)
  - `Asolaria/skills/desktop-dual-capture/skill.json`
    - Skill id: `desktop.dual_capture`
    - Approval required per run
  - Existing connector reused:
    - `Asolaria/src/connectors/desktopCaptureConnector.js` (`captureDesktopLayoutAndWindow`)
- Smoke test result: success
  - Output directory pattern: `Asolaria/captures/vision/<generated-tag>`
  - Captured:
    - per-screen PNGs
    - virtual desktop PNG
    - focused window PNG
    - `manifest.json`

## Safety guardrails used
- Explicit approval gate in skill step (`requiresApproval: true`)
- Bounded timeout and clamped numeric inputs in `skillRunner`
- No password/token harvesting or hidden persistence added
