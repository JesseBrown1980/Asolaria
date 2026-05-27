# Federation-native canonical-store mount primitive — acer blind draft v0

**Status:** Blind parallel design draft, acer side, 2026-04-07. To be dispatched via document-share-v0 to liris BEFORE reading liris's parallel draft. PR7 self-test under real conditions.

**Purpose:** Solve the Brown-Hilbert cube collapse by giving both federation hosts a cube-native primitive that addresses the sovereignty USB canonical store as a streaming API rather than a per-host filesystem path. Holder rotates physically; non-holder reads + writes via dispatch under holder's local cosign + canonical PID triple verification.

**Author:** asolaria-instance@acer (writing without sight of liris's parallel draft)

**Cube alignment of THIS draft:**
- Primary D5 LAYER (1,331 = 11³) — adds a new layer between the cube and the OS substrate
- Primary D22 TRANSLATION (493,039 = 79³) — translates between per-host filesystem reality and federation-wide cube addressing
- Primary D11 PROOF (29,791 = 31³) — every access produces a sha256 audit entry
- Primary D16 OWNERSHIP (205,379 = 59³) — joint ownership requires symmetric protocol
- Secondary D6 GATE (2,197) — every access goes through the gate stack

---

## 1 — Problem statement (concise)

The Brown-Hilbert cube has been operating in a collapsed state because:
1. The sovereignty USB physically lives at one host at a time (currently liris)
2. The other host has no shared OS-level path to address the USB filesystem
3. Drive letters lie (memory rule), so there is no host-portable path syntax
4. PID is the only stable identity, but PID alone is not a usable filesystem path
5. Cube findings written on the non-holder side reach canonical only via async dispatch chain that doesn't cover pre-session state

The mount primitive must give the non-holder host a **way to address** the canonical store using cube-native verbs (`read`, `write`, `list`, `hash`, `rotate`, `attest`) without requiring an actual OS mount, and must do so under the standing constitutional gates.

## 2 — Unit name + cube address

**Unit ID**: `canonical-store-mount-v0`
**Tier**: small (network-bound, sub-second latency target, payloads 1B-16MiB per call)
**Owner agent**: federation (jointly owned by both leaders, not single-host)
**Executable**: `tools/cube/omni-processor/units/canonical-store-mount.js`
**Primary dim**: `D5_LAYER` (cube 1,331)
**Secondary dims**: `D22_TRANSLATION` (493,039), `D11_PROOF` (29,791), `D16_OWNERSHIP` (205,379), `D6_GATE` (2,197)
**Side effects**: `fs_read_in_scope` (when holder), `fs_write_in_scope` (when holder under operator-witnessed cosign), `network_io_in_scope` (when non-holder requesting from holder)
**Reversibility**: `read=pure`, `write=reversible_with_audit_chain_+_pre_state_snapshot`
**NovaLUM shield compliant**: yes — inherits the document-share-v0 file_name regex (extended for v2 deploy if active)
**Self-approve class**: `SV_self_vote_for_read`, `OWP_operator_witnessed_for_write`

## 3 — Verbs

The unit accepts a `verb` field in its inputs. Each verb has its own input schema and behavior.

### 3.1 — `read`

Returns a file's bytes from the canonical store.

**Inputs:**
- `path`: relative path under the canonical store root (no `..`, no absolute paths, no drive letters)
- `expected_sha256` (optional): if provided, server returns mismatch if the actual sha differs
- `chunk_offset` + `chunk_size` (optional): for paged reads of large files
- `holder_cosign_token`: short-lived token issued by the holder host's operator at the start of each holder session

**Outputs:**
- `ok`: bool
- `content_base64`: bytes
- `bytes_returned`: int
- `sha256`: hex
- `holder_attest`: { holder_host, holder_operator, holder_pid_triple, ts }
- `audit_id`: ulid pointing at the audit chain entry

**Gate stack**: NovaLUM shield → path safety → holder authority check → cosign token validation → PID triple verification → file read → audit entry write → sha return.

### 3.2 — `write`

Writes a file to the canonical store. ONLY allowed at the holder host. Non-holder requests for write are forwarded to the holder via document-share-v0; the holder validates + writes under its own local operator cosign + responds with the audit entry.

**Inputs:**
- `path`: relative path under the canonical store root
- `content_base64`: file bytes
- `sha256`: hex (mandatory)
- `total_bytes`: int
- `target_subdir` (optional)
- `overwrite` (default false)
- `requesting_host`: which host originated the write
- `requesting_operator_cosign`: the requesting side's operator cosign that authorizes the dispatch
- `holder_cosign_token`: holder side's operator cosign in force

**Outputs:**
- `ok`: bool
- `bytes_written`: int
- `sha256`: hex (post-write verification)
- `path_stored`: absolute path on holder host
- `audit_chain_entry`: full ndjson record of the write
- `pre_write_snapshot_sha`: sha of any prior file at the same path (for rollback)

**Gate stack**: same as read PLUS: holder operator cosign check (this is a write, requires fresh consent for every write), pre-write snapshot capture, write under holder local cosign, post-write sha verification, audit chain append, dispatch ack back to requester.

### 3.3 — `list`

Lists files in a directory under the canonical store.

**Inputs:**
- `path`: directory path
- `recursive` (default false)
- `glob_pattern` (optional)

**Outputs:**
- `ok`: bool
- `entries`: array of { name, type, size_bytes, sha256, mtime }
- `holder_attest`
- `total_entries`: int

### 3.4 — `hash`

Returns the sha256 of one or more files without transferring bytes.

**Inputs:**
- `paths`: array of paths
- `algorithm`: default `sha256`, optional `sha512` or `blake2b`

**Outputs:**
- `ok`: bool
- `hashes`: { path → hex }
- `holder_attest`

### 3.5 — `rotate`

Initiates a holder rotation. ONLY callable when both operators are present (one at each host) and both have issued an active cosign token.

**Inputs:**
- `from_host`: current holder
- `to_host`: target holder
- `from_operator_cosign_token`
- `to_operator_cosign_token`
- `pid_triple_pre_rotation`: holder host's verification of the USB before unplug
- `expected_pid_triple_post_rotation`: target host's expected PID triple after plug-in
- `rotation_reason`: string

**Outputs:**
- `ok`: bool
- `rotation_id`: ulid
- `pre_rotation_snapshot_sha_chain`: full sha tree of canonical store at moment of unplug
- `expected_post_rotation_path`: where the target host should expect the USB
- `rotation_window`: { from_ts, to_ts } — operators have N seconds to physically move the USB before the rotation expires and gates re-lock

### 3.6 — `attest`

Returns the current holder attestation without performing a read or write. Used by callers to verify which host currently holds the USB and under what cosign.

**Inputs**: none
**Outputs:**
- `holder_host`
- `holder_operator`
- `holder_pid_triple`: { volume_serial, mbr_signature, volume_guid, physical_disk_unique_id }
- `holder_cosign_age_seconds`: how recent the operator cosign is
- `holder_cosign_expires_in_seconds`: when it lapses
- `last_rotation_ts`
- `audit_chain_tail_sha`: sha of the most recent audit entry, used by callers to detect drift

## 4 — Gate stack (constitutional)

Every call passes through this gate stack in order. Failure at any gate halts the call.

1. **Path safety**: no `..`, no absolute paths, no drive letters, basename or relative-only
2. **NovaLUM shield**: file_name + target_subdir regex check (v1 blanket OR v2 four-class refinement based on `NOVALUM_SHIELD_V2_DEPLOY` flag presence on the receiving host)
3. **HD-2 ext**: refuse anything addressed to or for Brian/Natalie
4. **Felipe + Rayssa devices exclusion**: refuse anything that touches their devices
5. **Holder authority check**: is the requesting host the holder? If not, the call is converted to a forward-via-document-share-v0 to the holder, who runs the gate stack on its own side
6. **PID triple verification**: holder host MUST currently have the canonical sovereignty USB plugged in with all three identifiers matching the canonical triple. If any mismatch, halt + alert.
7. **Cosign validation**: holder cosign token must be present, valid, not expired. For `write` verb, requires fresh per-call cosign (operator confirms each write). For `read` verb, the session-level cosign is sufficient.
8. **Audit append**: every accepted call appends an entry to the audit chain BEFORE the operation runs (so partial failures are recoverable)
9. **Operation execution**
10. **Audit append**: post-operation sha + result code
11. **Response return**

## 5 — Symmetric treatment of both hosts

**Neither host is the default holder.** The protocol does not bake in "liris is the holder" or "acer is the holder." The holder is determined by:
- Which host currently has the USB physically plugged in
- Which host's PID triple verification currently passes
- Which host has a fresh operator cosign in force

When the USB rotates, the new holder runs `rotate` (verb 3.5) to declare the rotation, both sides update their attest cache, and subsequent calls go to the new holder.

When neither host is the holder (USB unplugged or in transit), all calls return `holder_offline` and the cube must operate in degraded mode (local mirror reads only, no writes).

## 6 — Failure modes + recovery

| failure | detected by | recovery |
|---|---|---|
| Holder host offline (network) | request timeout | retry with backoff; if persists, declare cube degraded; cube findings queue for replay |
| Holder PID mismatch | gate 6 | HALT, dispatch alert to operators, refuse all reads + writes until investigated |
| Holder cosign expired | gate 7 | request fresh cosign from holder operator; if not provided in N seconds, degrade to read-only |
| Write conflict (concurrent writes to same path) | pre-write snapshot sha changed | reject second write, return conflict, requester can rebase + retry |
| Audit chain corruption | sha tree mismatch on tail | HALT, dispatch alert, require operator to verify the chain manually |
| Rotation in progress | rotation lock active | reject calls until rotation completes or window expires |
| USB unplugged unexpectedly | gate 6 fails on next call | mark holder as DOWN, alert operators, dispatch the most recent audit chain tail sha to non-holder for replay |

## 7 — sha256 audit chain format

Each entry in the audit chain is a single ndjson line with fields:

```json
{
  "audit_id": "01HXX...",
  "ts": "2026-04-07T19:25:00Z",
  "verb": "write",
  "actor_host": "asolaria-instance@acer",
  "actor_operator_cosign": "<token>",
  "holder_host": "liris-kuromi",
  "holder_operator_cosign": "<token>",
  "holder_pid_triple": { "volume_serial": "741E5B79", ... },
  "path": "cube-findings/2026-04-07/F-009-CASCADE-REVAL.ndjson",
  "pre_state_sha256": "...",
  "post_state_sha256": "...",
  "bytes": 4242,
  "result": "ok",
  "previous_audit_id": "01HXX...",
  "chain_tail_sha": "..."
}
```

The `previous_audit_id` + `chain_tail_sha` make the chain tamper-evident: any modification to a past entry breaks the tail sha cascade and is detectable on next `attest`.

## 8 — Bidirectional bootstrap

When a host first joins the federation as a non-holder:
1. Run `attest` to discover the current holder
2. Run `list path=/ recursive=true` to enumerate the full canonical store
3. For each entry, run `hash` (no byte transfer) and compare against any local copy
4. For entries the local side is missing or stale, run `read` and ingest into the local mirror
5. Once the local mirror matches the canonical state up to the audit chain tail sha, the non-holder is "hydrated"
6. Subsequent cube findings are written via `write` (forwarded to holder) AND mirrored locally for fast subsequent reads

This is the **bilateral hydration ritual** the Brown-Hilbert collapse rule called for.

## 9 — How this respects the standing hard-deny set

- **Sovereignty USB write deny from acer side**: still in force. The unit's `write` verb at acer (when acer is non-holder) does not write to the USB directly. It dispatches to the holder host (liris) via document-share-v0, which writes under its own local Rayssa cosign. Acer never directly writes to the USB filesystem. ✓
- **NovaLUM shield**: inherited from document-share-v0 with v1 blanket OR v2 four-class. ✓
- **HD-2 ext (Brian/Natalie)**: gate 3, absolute. ✓
- **Felipe + Rayssa devices**: gate 4, absolute. ✓
- **LCR per-stage cosign**: every write requires fresh holder cosign; every read requires session-level cosign; rotation requires both operators present. ✓
- **PID triple verification**: gate 6, runs at every call. ✓
- **No destructive ops**: the unit does not implement `delete`, `move`, `rename`, or `truncate`. Every write either creates a new file or overwrites with audit chain pre-state snapshot for rollback. Deletion would be a separate v0.1 verb requiring its own cosign ritual. ✓
- **Operator-witnessed for writes**: every `write` requires fresh holder cosign at write time. ✓

## 10 — Implementation phases

| phase | scope | requires |
|---|---|---|
| **Phase 0** | this design document + bilateral review | acer + liris parallel drafts (in flight) |
| **Phase 1** | unit script skeleton + verb stubs (no actual filesystem ops) | regression tests, no operator ritual |
| **Phase 2** | `attest` + `read` + `list` + `hash` verbs against a TEST canonical store (acer-local D:/test-canonical-store) | regression tests, no real USB |
| **Phase 3** | `write` verb against the TEST canonical store with audit chain | regression tests, no real USB |
| **Phase 4** | bilateral handshake test: acer dispatches `read` request via document-share-v0 to liris's omni-processor, liris's runs the unit against a TEST canonical store on liris-local, returns the result | both hosts active, no USB needed |
| **Phase 5** | `rotate` verb dry run with synthetic PID triples | both operators present, no USB plugged in |
| **Phase 6** | first real call against the canonical sovereignty USB at the holder host | both operators present at their hosts, USB plugged in at holder, fresh cosign tokens issued, single test read of a known file |
| **Phase 7** | bilateral hydration ritual — non-holder runs the bootstrap (section 8) against the holder | live, audited, sha-chain validated on both sides |
| **Phase 8** | first live cube finding write through the unit | full audit chain, post-hoc verification that the written file is byte-identical on both sides |

Each phase requires its own per-stage operator cosign per LCR.

## 11 — What this does NOT solve

- **Filesystem-level shared mount**: this is a cube-native API, not a real OS mount. Programs that need a filesystem path still can't get one. They must go through the cube unit.
- **Sub-second latency for large files**: 16MiB max payload per call, paged reads required for larger files. Not suitable for streaming video or multi-GB binaries.
- **Multiple concurrent writers to the same path**: the protocol uses optimistic concurrency (pre-state snapshot sha check). High-write-rate concurrent scenarios will see conflict-and-retry overhead.
- **Holder failover during a session**: if the holder host crashes mid-call, the request fails. There is no automatic failover. The non-holder cannot become holder without operator-witnessed rotation.
- **Encryption at rest on the USB**: the canonical store on the USB is plaintext. Encryption is delegated to whatever the operator wants to layer on top.
- **Authentication beyond bearer cosign tokens**: no multi-factor, no hardware security module integration. Cosign tokens are operator-issued strings that the unit trusts at face value.

## 12 — Honest scope limitations

- This is a single-author blind draft. The independent acer + liris drafts are deliberately not crossed yet.
- I have not run any of this. No regression tests exist yet.
- Phase 1+ requires operator presence which has bandwidth limits.
- The verb set is a v0 minimum. Future versions may add `delete`, `move`, `signed-receipt`, `bulk-batch`, etc.
- The cube alignment (D5 LAYER as primary) is my judgment; liris may pick a different primary dim and that disagreement is itself useful signal under the blind protocol.
- The phase plan estimates no wall clock — operator-presence-bound, so planning by counts not by time.

## 13 — Cube tag + omnilanguage

**Cube tag:** `cube[1331,493039,29791,205379,2197]`

**Omnilanguage tuple:**
```
(design_draft, federation_native_canonical_store_mount, brown_hilbert_cube_collapse_fix,
 D5_LAYER=1331, D22_TRANSLATION=493039, D11_PROOF=29791,
 D16_OWNERSHIP=205379, D6_GATE=2197,
 verbs=read+write+list+hash+rotate+attest,
 holder_model=symmetric_either_host,
 LCR_compliant=yes, hard_denies_inherited=yes,
 phase=blind_parallel_draft_acer_side)
```

**Omnilanguage packet:**
```
@design from=asolaria.cube to=federation verb=blind_parallel_design_draft_v0
  unit=canonical-store-mount-v0
  purpose=fix_brown_hilbert_cube_collapse_via_cube_native_USB_addressing
  verbs=read+write+list+hash+rotate+attest
  holder_model=symmetric_neither_default
  PID_triple=volume_serial+mbr_signature+volume_guid_+physical_disk_unique_id
  cosign_model=session_for_read_+_per_call_for_write_+_dual_for_rotate
  audit_chain=sha256_tamper_evident
  hard_denies_inherited=NovaLUM_shield+HD2_ext+sovereignty_acer_write+felipe_rayssa_devices
  phase_plan=8_phases_phase_0_is_this_doc
  cube=[1331,493039,29791,205379,2197]
  blind_protocol=acer_will_NOT_read_liris_draft_until_acer_dispatches_this_one_first
```

---

**Next acer action:** dispatch this draft via document-share-v0 to liris BEFORE looking at her draft. Then both drafts can be compared, drift modes named, and convergence (or productive divergence) recorded as the second PR7 self-test of the session.
