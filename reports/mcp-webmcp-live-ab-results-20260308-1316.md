# MCP + WebMCP Live A/B Results (Post Pointer Alignment)

Generated: 2026-03-08 10:16 -03:00

## Runtime Config Confirmed
- Augment Context `toolSchemaMode=pointer`
- Augment Context `tokenReductionProfile=aggressive`
- Cursor MCP `toolSchemaMode=pointer`
- Cursor MCP `tokenReductionProfile=aggressive`

## MCP External Provider A/B (Live)
Prompt: `Reply with exactly: MCP_TEST_OK`

Initial run (before cooldown expiry):
- `baseline_no_mcp`
  - job: `job_1772974768759_70wgsw`
  - status: failed
  - error: cooldown until `2026-03-08T13:12:57.953Z`
- `optimized_mcp_pointer`
  - job: `job_1772974769517_8mhi9n`
  - status: failed
  - error: cooldown until `2026-03-08T13:12:57.953Z`

Automatic wait executed: `810s`

Rerun (after cooldown expiry):
- `baseline_no_mcp_rerun`
  - job: `job_1772975580266_fw1ttz`
  - status: failed
  - elapsed: `2652 ms`
  - error: OpenAI API `429` quota/rate-limit + cursor-agent terminal flags unavailable
- `optimized_mcp_pointer_rerun`
  - job: `job_1772975583140_9wg6p0`
  - status: failed
  - elapsed: `0 ms`
  - error: new cooldown until `2026-03-08T13:38:02.917Z`

Result: live MCP external A/B remains blocked by provider quota/cooldown, not by MCP/WebMCP configuration.

## WebMCP A/B (Live, Successful)
Target URL: `http://127.0.0.1:4781/api/health`

A) Broad WebMCP extraction
- job: `job_1772975653346_cxcwpo`
- status: completed
- elapsed: `33509 ms`
- `resultObject`: `14074` tokens (o200k)
- `text` field: `8124` tokens
- extracted payload: `5383` tokens

B) Constrained WebMCP extraction
- job: `job_1772975687530_vdazot`
- status: completed
- elapsed: `35743 ms`
- `resultObject`: `1383` tokens (o200k)
- `text` field: `901` tokens
- extracted payload: `360` tokens

WebMCP savings (constrained vs broad):
- Result object: `12691` tokens saved (`90.17%`)
- Text field: `7223` tokens saved (`88.91%`)
- Extract payload: `5023` tokens saved (`93.31%`)

## Conclusion
- MCP pointer alignment is active and verified.
- WebMCP absolutely matters for token cost: structured constrained extraction cuts payload by ~`89-93%` in live tests.
- Remaining blocker for live external-provider token usage deltas is account quota/cooldown, not architecture.
