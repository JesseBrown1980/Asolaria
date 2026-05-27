# Liris Rerun And Compute Partial Update

Generated: 2026-03-23 16:49:34 -03:00

## Source

Owner-relayed Liris progress update from Rayssa host during the active `IX-296` workstream.

## What Changed

### 1. Phone is not an active dependency right now

The phone is currently disconnected from USB and charging.

That means:

- current USB reachability is not assumed
- historical USB/reverse details stay historical until re-proved
- Gaia's active next order remains valid because the two live work items are:
  - compat `4781` rerun hardening
  - local compute-readiness proof

### 2. Liris found and narrowed the compat launcher bug

The compat rerun path had at least two real local failures:

- stale/duplicated process handling around the real `4781` listener PID
- helper parameter collision with PowerShell's built-in `$PID`

Liris patched the script on Rayssa host and moved the failure from a vague rerun myth into a concrete local launcher bug.

Current state:

- the rerun proof is still incomplete
- the next valid packet still needs first-launch, second-launch, listener PID, no-duplicate proof, and `4781`/`4791` health

### 3. The compute slice is present, but the current proof path is wrong

Liris confirmed the local Rayssa checkout contains the relevant compute/federation surfaces:

- worker/router profiles
- MQTT federation topics
- remote node registry surfaces
- gateway authority/config surfaces

But the attempted bounded proof path through `localops.run` using `npm`/`skills:validate` is not the right proof target.

Observed progression:

- first blocker: `spawn EINVAL`
- local connector patch removed that blocker
- current blocker: `EPERM` against `npm.cmd`

This means:

- the `npm` path is contaminated by Windows launcher/policy behavior
- it should not be used as the deciding proof for `computeWorkerReady`
- the honest next bounded proof should use the smallest clean executor possible, such as:
  - `python --version`
  - `rg --version`
  - `git --version`

### 4. The current honest compute stance remains conservative

Liris is correct not to force `computeWorkerReady=true` yet.

Current safe read is:

- compute slice present: yes
- node identity `liris`: yes
- MQTT federation topic model present: yes
- bounded local execution via the intended advertised path: not cleanly proved yet
- `computeWorkerReady=true`: not yet justified

## Durable Read

1. The phone lane does not need to be reopened for this pass.
2. The compat rerun work remains the first Rayssa-local hardening item.
3. `npm` is the wrong readiness proof path for the current bounded-compute packet on Rayssa host.
4. Liris should switch to the smallest clean bounded executor and only then decide whether `computeWorkerReady=true` is justified.
