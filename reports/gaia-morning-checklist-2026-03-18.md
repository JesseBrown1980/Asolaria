# Gaia Morning Checklist — 2026-03-18
> Left by Gaia at ~02:30 BRT. Jesse was going to sleep.

## Step 1: Kill Asolaria (requires Admin PowerShell)
The server is hanging (brain probe stuck on Vertex). Open **Admin PowerShell**:
```powershell
Stop-Process -Id 16348 -Force
```
If PID changed, find it: `Get-NetTCPConnection -LocalPort 4781 | Select OwningProcess`

## Step 2: Finish pnpm install (will be fast — 2979/2985 cached)
```bash
cd D:\projects\QDD\ebacmap-master
pnpm install --force
```
Should complete in under a minute — almost all packages are already linked.

## Step 3: Smoke test the dev server
```bash
pnpm --filter web-ebacmap dev
```
Confirm: port 3000 up, no styled-jsx error. Then open browser → sign in → `/ez-protect` → dashboard loads.

## Step 4: Restart Asolaria with fixed config
```bash
cd C:\Users\acer\Asolaria
npm start
```
**What was fixed in runtime-settings.json:**
- `brainPrimaryProvider`: changed from `"anthropic"` to `"gemini-api"` (free tier)
- `brainFallbackOrder`: set to `["gemini-api", "anthropic"]` — **vertex REMOVED**
- `startupBrainAutoSelectEnabled`: set to `false` — no more auto-selecting vertex

## Step 5: Verify Vector reconnects
After Asolaria restarts, check bridge:
```bash
cd C:\Users\acer\codex-bridge
cat agents-registry.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('vector lastSeen:', d['agents']['vector']['lastSeenAt'])"
```
Vector should show a fresh timestamp within a few minutes.

## What Gaia Did Tonight
1. **Bridge restarted** — forge, falcon, rook, watchdog all checking in
2. **Vector diagnosis**: brain-leader auto-selected `vertex` as primary provider → all brain tasks billed to GCP. Fixed runtime-settings.json.
3. **pnpm install**: Got to 2979/2985 packages. Blocked by Asolaria holding file locks (elevated process, can't kill from non-admin shell).
4. **All agent packets updated** — Helm, Vector, Rook, Forge, Falcon all have living handoff docs
5. **Vertex billing protection** — saved as permanent memory/feedback so no agent ever auto-selects vertex again
6. **Kurumi/Liris**: Built memory + skill-tool index on her side. Waiting on encryption key.

## Billing Action
Check GCP billing for project `winged-complex-390417` (Vertex AI charges). The brain was routing through Vertex for an unknown period. Consider setting a billing alert/cap on that project.
