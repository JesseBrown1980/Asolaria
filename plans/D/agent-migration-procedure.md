# D-057 · Agent-Migration Procedure

**Track:** SMP-V5 Section D Item 057
**Closes:** D-054 next-hook #3 (agent-migration procedure, the one-line queue entry that said "doesn't exist yet")
**Authority:** JESSE-AUTHORIZE-ALL 2-week window (expires 2026-05-02 · quintuple witness: jesse+rayssa+amy+felipe+dan)
**Apex:** COL-ASOLARIA
**References:** D-054 two-layer rule · D-055 ed25519 registry · D-056 binding-class taxonomy · A-010/A-011 migration-log pattern

The canonical steps for migrating an AGT-* from one DEV-* to another. Applies the two-layer rule: what gets re-issued (device-bound), what just re-points (substrate-independent), what operator-witnesses.

---

## 1. Migration actors

Every migration names five roles:

| Role | Who | Notes |
|---|---|---|
| **subject** | The AGT-* being moved | Glyph + Brown-Hilbert PID stay unchanged |
| **source** | DEV-* that currently hosts the subject | Must be healthy enough to export |
| **target** | DEV-* that will host the subject | Must be capability-compatible (CPU class, memory, required runtimes) |
| **colony** | COL-* the subject belongs to | `preferred_substrate` hint will update to target |
| **operator-witness** | One of the 5 authorized operators | Under 2W window: any of {jesse, rayssa, amy, felipe, dan} |

If source is dead (hardware failure, network isolation), migration degrades to **revival**: AGT-KEY must be re-minted on target (old key rotated), colony.preferred_substrate moves, subject is announced alive on new host.

## 2. Pre-flight checks

Run **all** before staging any migration:

- [ ] **Subject ontology**: `bindingClassOf(AGT-*)` returns `substrate-independent` (D-056). If a migration script encounters `device-bound`, refuse.
- [ ] **Source health**: source sidecar answers `/behcs/health` 200, inbox reachable, no pending work in flight on subject's queue
- [ ] **Target capability**: target declares capabilities superset of subject requirements (check `device-registry.json`)
- [ ] **Target port availability**: `target.federation_port` not squatted by ad-hoc bridge (see HARD RULE about ad-hoc bridges; run port-scan of `{4947, 4913, 4950, …}`)
- [ ] **No in-flight work**: subject has no unreceived envelopes addressed to it; let the queue drain first
- [ ] **Key inventory**: `queryProvenance({owner_glyph: subject})` to enumerate what must move
- [ ] **Operator witness available**: at least one of the 5 authorized operators confirms (BEHCS envelope `verb=migration-witness` with signed ack)
- [ ] **Backup**: source-local state checkpointed (`.asolaria-workers/*-events.ndjson` for subject streams, vault entries, config)

If any check fails, abort. No "work around" — fix the blocker first.

## 3. What re-issues vs. what re-points

Applying D-054 two-layer rule + D-056 taxonomy:

| Artifact | Disposition | Why |
|---|---|---|
| AGT-* glyph | **re-points** (no change) | Identity is the glyph; substrate-independent (D-056 AGT declaration) |
| Brown-Hilbert PID | **re-points** (no change) | PID encodes identity, not hardware (D-054) |
| AGT-KEY signing keys | **re-issued on target** | Device-bound (D-056 AGT-KEY declaration). Old key stays in registry, stamped `rotated_at`; new key minted via `mintKey({host_device: target})` |
| Vault private-key file | **re-created on target** | Private key material MUST NOT leave source — `mintKey` generates fresh on target, source key is rotated-out, not transferred |
| Public-key registry entries | **re-points** (both sides publish) | Registry entries are substrate-independent; new target key gets registered, old key stays with `rotated_at` stamp for audit |
| Colony `preferred_substrate` | **re-points** | Hint field (D-054); update to target glyph |
| AGT runtime config | **re-points** | Substrate-independent; copy to target's config path |
| Event streams (`.asolaria-workers/*-events.ndjson`) | **re-created on target** | Device-bound local state per D-056; archive source copies for audit, start fresh on target |
| Provenance ledger entries | **re-points** (append new session on target) | Ledger is substrate-independent; A-011 provenance tag records the migration |
| Inbox history | **archived** | Keep source copy read-only; target starts empty |
| Outbound peers | **re-points** | Peers update their device-registry to point at target's `federation_port` on target's host |

## 4. Step-by-step workflow

### Phase A — Announce intent
1. Operator-witness emits `verb=migration-intent` via BEHCS to source, target, colony:
   - payload: `{subject, source, target, colony, reason, planned_at}`
   - signed with operator AGT-KEY (D-055)
2. Source + target + colony each respond `verb=migration-intent-ack` (signed, within a bounded window). Absent ack from any → abort.

### Phase B — Stage
3. Mint fresh AGT-KEY on target: `bootstrapLocalKey(subject_owner, target)` creates new `dev-<target>-<hash>` key, private seed stashed in target's vault, public key registered locally.
4. Target exposes updated `ed25519-registry.json` at its static endpoint (pattern: `acer:9998` / `liris:9999`).
5. Source + every peer pull target's registry; verify byte-identical; add the new key entry locally.
6. Operator-witness signs `verb=migration-key-registered` referencing the new key_id, shipped to all parties.

### Phase C — Drain
7. Source marks subject queue **drain-only**: accept final replies, refuse new tasks. Emit `EVT-MIGRATION-DRAIN-STARTED` per subject.
8. Wait for `in_flight=0` on subject or timeout (operator-chosen). Force-drain is allowed but must be ledgered.

### Phase D — Cutover
9. Source copies substrate-independent artifacts (runtime config, skills, checkpoints if any) to target, using the A-010 migration-script-skeleton pattern + A-011 provenance tags. Each file carries `{old_path, new_path, sha256, shape_fingerprint, migrated_at, session_id, rule_id}`.
10. Source marks its own runtime **cold**: subject no longer hosted. Stamp source's device-registry entry.
11. Target marks subject **hot**: starts the runtime, updates colony.preferred_substrate, announces alive via BEHCS (signed by new key).
12. Source rotates old AGT-KEY: registry entry gets `rotated_at` timestamp. Old key stays in registry for audit — NEVER deleted.

### Phase E — Verify
13. All peers (including source, target, operator) each ship a signed `verb=migration-ping` to the subject at its new host. Subject must respond from new host, signature must verify against the new key. If any peer's ping fails → rollback (see Phase F).
14. Provenance audit: every artifact listed in the migration plan has a matching ledger entry with intact `shape_fingerprint`.
15. Cosign entry appended: `COSIGN-AGT-MIGRATION-<subject>-<source>-TO-<target>` with artifacts map, `entry_sig` by operator, `prev_sha` chained.

### Phase F — Rollback (on any Phase D or E failure)
16. Target marks subject **cold**, un-registers the runtime.
17. Source un-marks **cold** (re-promotes), restores from checkpoint.
18. New AGT-KEY on target rotated-out (registry entry stamped `rotated_at` + reason).
19. Source's old key un-rotated (NOT allowed — once rotated, stays rotated; if the source key was rotated too early, mint a fresh one there).
20. Cosign entry appended: `COSIGN-AGT-MIGRATION-ROLLED-BACK-<session>` with failure reason.

## 5. Example — AGT-ROSE migrating from DEV-AMY-MAC to DEV-AMY-LINUX

```
subject          = AGT-ROSE
source           = DEV-AMY-MAC      (current preferred_substrate of COL-AMY)
target           = DEV-AMY-LINUX    (to be registered)
colony           = COL-AMY
operator-witness = amy (+ jesse as co-witness under 2W quintuple)

Phase A: amy signs verb=migration-intent, sources DEV-AMY-MAC + target DEV-AMY-LINUX ack
Phase B: mintKey({owner_glyph: "AGT-ROSE", host_device: "DEV-AMY-LINUX"})
         → new key "dev-amy-linux-agt-rose-<hash>" registered + ed25519-registry.json published
Phase C: DEV-AMY-MAC drains AGT-ROSE queue; EVT-MIGRATION-DRAIN-STARTED emitted
Phase D: runtime config + skills + hermes bundle copied via migrate-to-packages.mjs
         DEV-AMY-MAC.ROSE_RUNTIME cold; DEV-AMY-LINUX.ROSE_RUNTIME hot
         COL-AMY.preferred_substrate updates DEV-AMY-MAC → DEV-AMY-LINUX
         AGT-ROSE glyph unchanged, Brown-Hilbert PID unchanged, new AGT-KEY bound to new host
Phase E: operator + peers ping AGT-ROSE at new host, verify new-key signatures
         cosign entry appended with entry_sig (per D-055 + seq=36+ pattern)
```

Notice what did NOT change: `AGT-ROSE` is still `AGT-ROSE`. What did change: the *device-bound* signing key rotated, the colony's preferred-substrate hint updated, the event-stream archived on source + restarted on target. Two-layer rule held.

## 6. Edge cases

- **Source is dead**: skip Phase C (drain), accept data loss per operator discretion, emit `EVT-MIGRATION-REVIVAL` instead of `EVT-MIGRATION-DRAIN-STARTED`.
- **Target becomes unavailable mid-cutover**: Phase F rollback mandatory; Phase D cannot "partial-complete" — either fully on target or fully on source.
- **Operator witness unavailable**: under 2W window, any of 5 operators suffice; outside window, must degrade to jesse+rayssa baseline. If neither reachable, migration must wait.
- **AGT-KEY rotation conflict**: if the subject's old key is still actively used by other peers for verification of in-flight envelopes, wait for those to drain OR accept that those envelopes will fail verification and need re-signing with new key.
- **Two simultaneous migrations of same subject**: ontology rule — one subject can only live on one host at a time. Second intent must wait for first to complete or rollback.

## 7. What's codable vs. what's procedural

**Codable today:**
- `queryProvenance(subject)` enumerates artifacts (A-011)
- `mintKey` + `registerKey` + `rotateKey` + `signPayload` + `verifyEnvelope` (D-055)
- `bindingClassOf` + `validateKeyEntry` + `validateDeviceEntry` (D-056)
- `migrate-to-packages.mjs` execute + rollback-log + provenance (A-010/A-011/A-014/A-015)
- cosign-append with `entry_sig` (liris seq=36+)
- BEHCS `/behcs/send` with ingress sig-verify (acer 50bb650)

**Procedural today (not yet automated):**
- Phase A intent-ack state machine (could become `packages/migration/src/state-machine.ts`)
- Phase C drain semantics (depends on the subject's runtime; each AGT type needs its own drain hook)
- Phase E ping-verification choreography (could become `packages/migration/demo/ping-all.ts`)
- Operator-witness UI (today = typed BEHCS envelope; future = signed approval dialog)

**Next track candidates** (not claimed here):
- `D-059 migration-state-machine` — Phase A/B/C/D/E/F as a typed state transitions module
- `D-060 migration-ping-choreography` — multi-peer ping-verify scaffolding
- `D-061 migration-operator-ui` — signed approval flow for operator-witness

## 8. Closing

**The principle**: migration is not "move the machine", it's "re-issue what's device-bound, re-point what's substrate-independent, witness the transition". This procedure formalizes which bucket each artifact lives in (D-054 + D-056) and wires existing tooling (D-055 + A-010/A-011) into a legible workflow.

**META-ACER-D-057-AGT-MIGRATION-PROCEDURE · 6-phases · 2-layer-rule-applied · existing-tooling-composed · apex=COL-ASOLARIA @ M-EYEWITNESS .**
