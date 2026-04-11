# QDD / eBacMap — pnpm Version Resolution

**Prepared:** 2026-03-17
**For:** Brian / QDD team

---

## The situation

The project declares `pnpm@9.12.2` in `package.json` but the dev machine is running
`pnpm@10.32.0`. Corepack isn't enforcing the pin, so the mismatch is silent. The EZ
Protect tests all pass today, but if anyone runs `pnpm install` the 30 000-line lockfile
will be silently regenerated in pnpm 10 format — breaking any dev or CI environment still
on pnpm 9.

We've prepared **two ready-to-merge branches**. Pick one.

---

## Branch A — `chore/pnpm-10-upgrade` *(recommended)*

Upgrades the project to pnpm 10.32.0. `packageManager` updated, `engines` updated,
lockfile regenerated, full verification green.

**What changes:**

| File | Change |
|------|--------|
| `package.json` | `packageManager: pnpm@10.32.0`, `engines.pnpm: ^10.0.0` |
| `pnpm-lock.yaml` | Regenerated (format 9 → 10) |

**Verification that will pass before we hand it over:**
- TSC clean
- EZ Protect unit suite (11 tests)
- EZ Protect integration suite (4 tests)

**One thing Brian's team needs to check:** if CI uses `pnpm/action-setup` or a hardcoded
pnpm version, update that to `10` at the same time. We can do that too if you share the
CI config.

**Why we lean this way:** pnpm 10 is current stable, the lockfile is going to drift toward
it anyway, and we're already handing you a clean branch — might as well resolve it
permanently rather than push the problem forward.

---

## Branch B — `chore/pnpm-9-repin`

Keeps `pnpm@9.12.2` exactly as declared. No lockfile changes. Fixes the enforcement
gap so corepack actually uses the pinned version.

**What changes:**

| File | Change |
|------|--------|
| `package.json` | Adds `"preinstall": "npx only-allow pnpm@9"` script to hard-block wrong versions |
| `README` / onboarding note | Add one line: run `corepack enable pnpm` once after cloning |

No lockfile diff. The `packageManager` field already declares 9.12.2 — we just make
the enforcement explicit.

**Verification that will pass:** same gates, same results — TSC clean, 11 unit, 4
integration.

**Tradeoff:** pnpm 9 will eventually go out of active support. This defers the upgrade
rather than resolves it.

---

## Our recommendation

Do **Branch A** (pnpm 10). It's the permanent fix, the tests already pass under pnpm 10,
and a clean branch is the right moment to do it. Branch B is the safe fallback if the
team isn't ready to touch the lockfile right now.

Let us know which to finalize and we'll have it ready for review.
