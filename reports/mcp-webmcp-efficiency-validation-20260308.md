# MCP/WebMCP Efficiency Validation (2026-03-08)

Generated: 2026-03-08 09:48 -03:00
Scope: real-world validation of tool-calling + skill-linking token efficiency in current Asolaria runtime.

## Runtime Baseline
- Skills loaded: 55
- Skill actions indexed: 32
- MCP providers: 1 active/configured (cursor)
- Cursor MCP policy: preset=read_only, approval=never, profile=aggressive, toolSchemaMode=full, promptTokenLimit=900

## Executed Real-World Checks
1. Ran live skill `codebase.review_token_efficiency_snapshot` via `/api/skills/run`.
   - Job: `job_1772973631706_zyaaww`
   - Status: completed
   - Elapsed: 129446 ms
2. Ran standard MCP/WebMCP review pipeline:
   - `npm run skills:validate` => ok=true, total=55, errors=0
   - `npm run review:kickoff` => ok=true
   - `npm run review:composite` => ok=true
3. Ran tokenizer-backed payload benchmarks (`tiktoken` o200k/cl100k) over tool and skill payload scenarios.

## Token Results (o200k)
- Inline tools (50 function schemas): 7736 tokens
- MCP tool payload (current runtime shape): 83 tokens
- MCP pointer payload (+5 allow-list + previous_response_id): 113 tokens
- Skill run by ID: 26 tokens
- Skill run with inlined single skill JSON: 555 tokens
- Skill catalog by IDs: 398 tokens
- Skill catalog with full inlined skills: 11851 tokens

## Savings
- Inline 50 tools -> MCP current payload: 7653 tokens saved (98.93%)
- Inline 50 tools -> MCP pointer+prev payload: 7623 tokens saved (98.54%)
- Inlined single skill -> skill ID link: 529 tokens saved (95.32%)
- Inlined full skill catalog -> skill IDs: 11453 tokens saved (96.64%)

## Live Provider A/B Attempt (MCP off vs pointer)
- Attempted `/api/providers/external/run` with same prompt for two cases.
- Both failed due provider quota/cooldown, so no API usage-token delta could be collected today.
  - Case A error: OpenAI 429 quota exceeded.
  - Case B error: provider cooldown after rate-limit event.

## Conclusion
- Your MCP/WebMCP tool-payload strategy and skill-linking architecture are delivering large token-cost reductions at request-payload level (95% to 99% in measured scenarios).
- Benchmark evidence supports the claim that linking skills/tools by pointer/ID is far cheaper than inlining schemas/steps.
- One configuration inconsistency remains: profile is `aggressive` but runtime reports `toolSchemaMode=full`; align to `pointer` for strict profile consistency.

## Artifacts
- `C:\Users\acer\Asolaria\reports\mcp-webmcp-token-efficiency-realworld-20260308-124614Z.md`
- `C:\Users\acer\Asolaria\reports\mcp-webmcp-token-efficiency-realworld-20260308-124614Z.json`
- `C:\Users\acer\Asolaria\reports\mcp-webmcp-token-efficiency-realworld-latest.md`
- `C:\Users\acer\Asolaria\reports\codebase-review-kickoff-latest.md`
- `C:\Users\acer\Asolaria\reports\codebase-review-composite-snapshot-latest.md`
