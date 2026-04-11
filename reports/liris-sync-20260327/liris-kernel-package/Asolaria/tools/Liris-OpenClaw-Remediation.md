# Liris OpenClaw Remediation

This run is the single-source audit of the Liris sub-colony’s OpenClaw removal. It lists the mistakes we corrected, the tool/health updates we shipped, and the skill-level changes that kept Liris connected to Asolaria without exposing legacy OpenClaw surfaces. Index this file (and any future follow-ons) so the MCP skill catalog can surface the story next time the Liris node is inspected.

- We previously let the UI expose every OpenClaw button and cron form, and we routed natural-language commands (`openclaw status`, cron runs, approvals, nodes) through the intent router. Those surfaces are now gone and the controlling card is replaced with the Liris Toolset explainer, so no “command → OpenClaw call” path survives. See `public/index.html:1161-1165` and `src/intentRouter.js:941-1033`.
- The old risk stack still treated OpenClaw actions as medium/high risk, which kept logs and policies keyed on legacy tooling. Removing those action mappings ensures the Liris risk graph stays focused on the Asolaria-native schedule. View the change at `src/riskEngine.js:101-123` and `src/edgeRiskEngine.js:53-85`.

- The new “Liris Toolset” card now sits between skills and the gateway audit panel so operators see that OpenClaw is retired and can follow `tools/Liris-OpenClaw-Remediation.md` for the new MCP/skill mapping. Refer to `public/index.html:1161-1165`.
- The health monitor now only mentions the real toolchain and removed the OpenClaw badge/state string; the trimmed summary keeps telemetry clean for Liris. That summary lives at `public/app.js:9401-9455`.
- The install planner intentionally notes the absence of OpenClaw and prefers the documented Asolaria skill/MCP mesh for future indexing. See `src/installPlanner.js:86-99`.

## Skills
- The brain orchestrator no longer imports or attempts OpenClaw and refreshes its fallback list to “anthropic → gemini-api → vertex → gemini-cli → cursor → antigravity.” This is documented in `src/brainOrchestrator.js:1-24` and `src/brainOrchestrator.js:162-169`.
- Intent routers, risk maps, and skill behavior now exclusively target the remaining connectors (no more `openclaw_*` actions). See `src/intentRouter.js:941-1033` for the cleaned rules.
- Document this remediation so MCP indexes can surface the safe skillset and the lessons we learned from the OpenClaw surface; treat this file as the tagging anchor for future Liris audits.

## Indexing
- Add `tools/Liris-OpenClaw-Remediation.md` to the MCP/skills inventory (e.g., via `tools/snapshot-asolaria.js` if you collect new docs). New skills referencing this run should mention this file in their `notes` so future workers find the “mistakes → tools → skills” link chain.
