# Liris Startup Validation

- Generated: `2026-03-23T16:48:01.8427843-03:00`
- Source report: `C:\Users\acer\Asolaria\reports\liris-next-phase-startup-report-template.md`
- Verdict: `blocked_runtime`
- Ready for next phase: `False`

## Checks

| Check | OK | Detail |
|---|---|---|
| branch_recorded | yes | - Commit: |
| commit_recorded | yes | - Git status: |
| node_version_recorded | yes | - npm version: |
| npm_version_recorded | yes | - Codex version: |
| codex_version_recorded | yes | ## Install |
| install_result_recorded | yes | - If failed, exact error: |
| install_not_failed | yes | no install failure detected |
| health_json_recorded | yes | health block present |
| health_ok_true | no | missing ok=true |
| mqtt_result_recorded | no | missing |
| mqtt_success | no | 18883 not confirmed reachable |

## Recommendations

- Ask Liris for the exact /api/health/fast response or the startup error from the 
pm start shell.
- Keep manual owner relay as the only return path. Do not assume MQTT reachability yet.
- If the health JSON is present but ok is not true, treat the Rayssa runtime as blocked, not partially ready.
- Ask for a resend using the report template if key fields are missing.

