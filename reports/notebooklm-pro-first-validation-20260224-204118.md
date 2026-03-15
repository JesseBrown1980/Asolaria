# NotebookLM Pro-First Validation

- Date: 2026-02-24 23:41:18 UTC
- Account: plasmatoid@gmail.com
- Project: winged-complex-390417

## Runtime checks
- /api/health: ok=true
- /api/integrations/slack/status: configured=false (separate blocker)
- Enterprise watcher: enterpriseReady=false, ccess=false, equiredSubscriptionTier=SUBSCRIPTION_TIER_NOTEBOOK_LM_INTERACT
- Watcher evidence log: eports/notebooklm-enterprise-watch-20260224-204102.log

## Code fix applied
- Patched src/connectors/notebooklmConnector.js chooseBestGoogleAccount(...) to prioritize configured defaultAccount / primaryRuntimeAccount before heuristic Drive-scope selection.
- Added fallback viability preference for active or refreshable tokens.

## Validation after patch
- Direct connector probe unNotebooklmAsk({ query: ... }) now resolves account to plasmatoid@gmail.com and succeeds with provider gemini_api.
- Result snapshot:

`json
{
  "accountUsed": "plasmatoid@gmail.com",
  "provider": "gemini_api",
  "warnings": [],
  "refs": 4
}
`

## Manual owner action still required
- Assign NotebookLM Enterprise license tier SUBSCRIPTION_TIER_NOTEBOOK_LM_INTERACT to the principal.
- Re-run 	ools/Watch-NotebookLM-EnterpriseReadiness.ps1 after assignment.
