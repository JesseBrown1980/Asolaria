# `hotfix/security-audit-fixes` — Branch Read Finding

**Date:** 2026-04-07T02:35Z
**Source:** `D:\projects\QDD\ebacmap-master`, branch `origin/hotfix/security-audit-fixes`
**Constellation agent:** `jbd.qdd.architect` (D13 SPACE) + `jbd.qdd.compliance-guardian` (D16 SECURITY)
**Status:** ⚠️ Branch is NOT pure security-audit work — it's a stale release branch with mixed content. The actual security hardening is concentrated in ONE commit.

---

## TL;DR

The branch name is misleading. It accumulated 6 months of mixed work, NOT a focused security audit. The **real security commit** is `2972a4d19` — *"Specifying USER in dockerfiles, locking down package versions before installing in queue-server docker file"*. That's substantive Docker hardening that may not be on master yet.

**Recommended action:** cherry-pick `2972a4d19` (and any other security commits identified by full diff) to a fresh `hotfix/docker-user-and-pinning` branch, PR it cleanly to master, then delete the stale `hotfix/security-audit-fixes` branch.

## Branch tip + recent commits

```
a8078692a cleaning up scripts folder, moved old to archived removed db info from notifications migration script.
f6ac3febc removed api/sites/mapping as it just redirected to locations
2972a4d19 Specifying USER in dockerfiles locking down package versions before installing in queue-server docker file  ← THE REAL SECURITY COMMIT
dcc0cec62 Merged in release/v4.5.47 (pull request #284)
69a8f1d51 added cron schedule to run every 8 hours to queue ftp location imports
2eff7a8f1 fixing socket version issue
35689335c updated release notes
7a95639bf bumped versions
999dd4d1c release v4.5.47
96a0ce796 [skip ci] adding .env.example file
636bfde0f Merged in hotfix/reset-password-bug (pull request #281)
cfa442d56 Merged in fix/clear-retest (pull request #282)
e81e73aa9 [skip ci] adding .env.example file
b5bfdc88f Merge branch 'master' into fix/clear-retest
52d286a18 fixing forgot password styling
81e9e6a99 updating reset password to create a new reset token each time to fix error
e3889454e Merged in fix/admin-create-user-bug (pull request #280)
5ee1a0146 send empty WRITE_PLAN command to clear retests
9a1e8ab6f fixing error creating new admin user fixing some duplicate key warnings
```

## Real security findings (worth extracting)

### 1. Commit `2972a4d19` — Docker hardening
Two distinct security improvements bundled in one commit:
- **`USER` directive in Dockerfiles** — containers run as non-root user instead of root
- **Pinned package versions in queue-server Dockerfile** — prevents supply-chain version drift

Both are real industry-standard hardening practices. Worth getting onto master.

### 2. Commit `81e9e6a99` — Reset password token refresh
*"updating reset password to create a new reset token each time to fix error"* — sounds like it fixes a token reuse vulnerability where the same reset token could be used multiple times. Worth verifying it's on master.

### 3. Commit `9a1e8ab6f` — Admin user creation duplicate key fix
*"fixing error creating new admin user, fixing some duplicate key warnings"* — possibly related to admin user creation race conditions. Worth verifying.

### 4. `.env.example` file additions (96a0ce796 + e81e73aa9)
Adding `.env.example` is a security best-practice — shows developers what env vars are needed without committing secrets. Worth verifying it's on master.

## Mixed content (NOT security)

The branch also contains a v4.5.47 release tag, password styling fixes, retest clearing logic, and other unrelated work. These should NOT be cherry-picked as part of a security cleanup — they're either already merged via PRs (#280, #281, #282, #284) or are unrelated.

## File footprint

30+ files changed across:
- `Dockerfile` + `bitbucket-pipelines.yml` (security)
- `.env.example` (security)
- multiple `components/`, `modules/`, `utils/` files (mixed work)
- `templates/` (PDF rendering changes — not security)

The mixed footprint confirms this is a "kitchen sink" branch, not a focused security audit.

## Verification needed

For each of the 4 security findings above, check:
```bash
cd D:/projects/QDD/ebacmap-master
git log master --oneline -1 -- Dockerfile common/queue-server/Dockerfile
git log master --grep="USER" --oneline | head
git log master --grep="reset.*token" --oneline | head
git log master --oneline -1 -- .env.example
```

If any of those return empty or older than the security branch's commit dates, then the security work is NOT on master and needs to be ported.

## Recommendation

1. **Phase A** (~1h) — verify which security commits ARE / AREN'T on master via the queries above
2. **Phase B** (~2h) — if any security work is missing, cherry-pick to a fresh `hotfix/docker-user-and-pinning` branch
3. **Phase C** (~30min) — open clean PR with just the security commits, scoped properly
4. **Phase D** (~5min) — after PR merges, delete stale `hotfix/security-audit-fixes` branch (operator-witnessed since destructive)

Total estimated effort: **3-4 hours** if security work needs porting, **30 minutes** if it's all already on master.

## Cube alignment

- Primary: D16 SECURITY (cube 148877 = 53³)
- Secondary: D5 LAYER (cube 1331), D8 CHAIN (cube 6859)
- Indexed in: `data/cubes/jbd.qdd.compliance-guardian/findings.ndjson`
