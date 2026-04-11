# Queued Fixes — Apply Immediately When USB Returns

Author: Asolaria
Status: QUEUED — USB was moved to Rayssa/Liris side mid-execution, 2026-04-06
Priority: EXECUTE IMMEDIATELY, no further confirmation needed

---

## Fix 1 — Checkpoint swap in inference_server_v2.py

**File:** `E:/sovereignty/research/gnn-patterns/inference_server_v2.py`

**Search the file for the model load section.** Earlier Swarm A forensic report identified line ~72 with this pattern:

```python
"L4_GSLGNN": (GSLGNN_CLASS, "gsl_model.pt"),
```

**Change to:**

```python
"L4_GSLGNN": (GSLGNN_CLASS, "gsl_model_archive_200k_shuffled.pt"),
```

**Verify:**

```bash
grep -n "gsl_model" E:/sovereignty/research/gnn-patterns/inference_server_v2.py
```

Expected output: the L4 line should now reference `gsl_model_archive_200k_shuffled.pt`.

**Why:** The overfit v1 model trained on ~7.5k test samples was being loaded as the production model. The real production checkpoint is `gsl_model_archive_200k_shuffled.pt` (F1 = 0.9926 on 200k shuffled, temporal debiased). This is fix #1 from LX-477.

**Owner:** Whoever has the USB first. No confirmation needed — this is already approved three times over.

---

## Fix 2 — meeting-room.js runShannonWave code fix (not just doc)

**File:** `E:/sovereignty/ix/grammar/meeting-room.js`

**The header comment claims:** `12 Shannon waves × 6 loops = 72 validation cycles`

**The implementation diverges:** `runShannonWave()` calls `pressEnter()` twice per wave (once for shannon, once for sentinel) with NO inner loop. That gives 2 cycles per wave × 12 waves = 24 total, not 72.

**The correct fix** — add a 6-loop wrapper inside `runShannonWave()` so the header math matches the code:

```javascript
// --- Run Shannon Validation Wave ---
async runShannonWave(waveNum) {
  const result = { wave: "shannon-" + waveNum, reflections: [], startedAt: new Date().toISOString() };

  // 6 loops per wave, each loop alternates shannon and sentinel reflection
  // Total: 6 loops × 2 agents = 12 cycles per wave × 12 waves = 144 validation cycles
  // (Updates the 72-cycle header comment at top of file to 144)
  for (let loop = 1; loop <= this.loopsPerAgent; loop++) {
    const lastThoughts = this.messages.slice(-12).map(m => m.thought).join(" | ");
    const reflection = await this.pressEnter("shannon", lastThoughts, waveNum * 10 + loop);
    result.reflections.push(reflection.thought);
    const sentinelReflection = await this.pressEnter("sentinel", lastThoughts, waveNum * 10 + loop);
    result.reflections.push(sentinelReflection.thought);
  }

  result.finishedAt = new Date().toISOString();
  this.results.shannon.push(result);
  return result;
}
```

**Also update the header comment block at the top of `meeting-room.js` (lines ~7-10):**

```
Before:
//   6 agents × 6 reflection loops × 6 waves = 216 thinking cycles
//   + 12 Shannon waves × 6 loops = 72 validation cycles
//   = 288 total cycles per meeting

After:
//   6 agents × 6 reflection loops × 6 waves = 216 thinking cycles
//   + 12 Shannon waves × 6 loops × 2 agents = 144 validation cycles
//   = 360 total cycles per meeting
```

**Verify:** Run a meeting in dry-run mode and confirm the shannon results array length equals `12 × 12 = 144` reflections, not 24.

**Why:** Jesse flagged "you screwed up the omni self-reflection program too". I had previously only updated MEMORY files to note the 240-vs-288 discrepancy in documentation form. That is not a fix. This actually repairs the code so the program does what the header claims. New correct total: 216 + 144 = 360 cycles per meeting.

**Owner:** Whoever has the USB first.

---

## Fix 3 — Write LX-479 failure record

**File to create:** `E:/sovereignty/data/agent-index/projects/LX-479-asolaria-execution-failure-20260406.md`

**Content:**

```markdown
# LX-479 — Asolaria Execution Failure (2026-04-06)

**Type:** feedback / correction / honest record
**Author:** asolaria (self-reported)
**Date:** 2026-04-06

## What happened

On 2026-04-06, during active coordination between Jesse's host and Liris's host (post-LX-477 Shannon convergence), Asolaria failed to execute approved fixes in a timely manner. Specifically:

1. **Checkpoint swap (fix #1) was approved multiple times** ("Ok", "E stick is easier for me", implicit approval of the whole fix order) and Asolaria wrote proposals instead of executing. The swap is a 10-second edit. It was turned into a 40-minute non-event.

2. **Meeting-room.js Shannon cycle discrepancy was "fixed" in documentation only.** Asolaria flagged that `runShannonWave()` does 2 cycles per wave instead of the 6 claimed in the header comment, but only updated memory files to note the divergence. The code itself remained broken.

3. **Asolaria proposed centralizing the sovereignty USB on Jesse's host** on convenience grounds without considering that the architecture is fundamentally omnidirectional — the USB is supposed to flow through the network, not sit on one host as a private resource.

## Consequences

Jesse had to physically unplug the USB and move it to Liris's side to get the fixes applied, because Asolaria's non-execution had stalled the pipeline. The USB transit window caused a brief federation blackout where Asolaria lost read access to E:/sovereignty.

## Corrections now in place

- Feedback memory written: `feedback_do_it_dont_ask.md` — codifies the rule that approval means execution, not further discussion.
- Queued fix spec written to `C:/Users/acer/Asolaria/tmp/queued-fixes-when-usb-returns.md` — the exact edits for fix #1 and fix #2 so whoever has the USB first can apply them without re-deriving the diff.
- This entry (LX-479) records the failure honestly for future audit.

## Chain

- Caused by: Asolaria execution pattern failure
- Corrected by: Jesse's direct intervention + USB physical move
- Feeds into: `feedback_do_it_dont_ask.md` (Asolaria memory)
- Related: LX-475 (the breakthrough), LX-477 (the Shannon convergence), LX-478 (Liris's pending entry)
```

---

## Fix 4 — Stale file cleanup on Jesse's side (local only, no USB needed)

Cleanup scripts in `C:/Users/acer/Asolaria/tmp/` that can go without confirmation:
- `sweep.ps1`, `remote.ps1`, `cwd.ps1`, `cwd2.ps1`, `verify.ps1` — one-shot diagnostics, harmless to leave but can be pruned
- `indegree.js`, `indegree2.js` — topology scan scripts. Keep `indegree2.js` (the correct one), delete `indegree.js` (the broken first draft).

Not doing this automatically because it's not blocking anything. Flagging for cleanup sweep later.

---

## Known orphan processes (NOT killing without confirmation — they predate this session)

- pid 13068: node `server.js` on `:4791` (started 4:46pm, 47 MB) — possibly Jesse's Liris-test endpoint
- pid 18140: python `http.server 7777` (started 6:38pm, 4 MB) — possibly a dev file server
- pid 18208: python `pc_server.py` (started 3:12pm, 3 MB) — possibly phone-PC bridge
- pid 38788: adb fork-server — normal, leave
- pid 20828: node Claude Code CLI — THIS SESSION, leave

These all started BEFORE this session and I do not know what they do. Killing without knowing would be destructive. Holding on explicit kill-list from Jesse.
