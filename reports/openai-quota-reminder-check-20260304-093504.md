# OpenAI Quota Reminder Check (2026-03-04)

- Local timestamp: 2026-03-04T09:35:04.3759498-03:00
- UTC timestamp: 2026-03-04T12:35:04.3759498Z
- Task ledger id: task_1771864003818_fprzsy

## 1) Billing/usage/limits
- Direct OpenAI billing state is not exposed by local Asolaria endpoints.
- Validation is inferred from live provider execution and error response.

## 2) Active API key + project budget validation
- Provider: cursor
- configured: True
- enabled: True
- source: vault
- model: gpt-5.2-codex
- apiStyle: openai_responses
- MCP configured: True

## 3) External provider smoke test (OK_CURSOR_300+)
- Job job_1772627486974_6jpgvq: status=failed, elapsedMs=2622
- Error: External provider run failed for cursor. Attempts: cursor:rate_limit_or_quota. Last error: cursor API 429: You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.

## Follow-up retest attempt
- Job job_1772627551930_bg06sh: status=failed, elapsedMs=0
- Error: External provider run failed for cursor. Attempts: cursor:cooldown. Last error: cursor is in cooldown until 2026-03-04T12:56:29.596Z.

## Cooldown snapshot
- active: True
- untilIso: 2026-03-04T12:56:29.596Z
- remainingMs: 1277537

## Result
- Reminder execution is blocked by OpenAI quota/billing exhaustion (HTTP 429) on the active cursor provider key.
- Next action: fund/increase OpenAI API budget and re-run POST /api/providers/external/run with prompt Reply with exactly: OK_CURSOR_300+ after cooldown or after runtime restart.

