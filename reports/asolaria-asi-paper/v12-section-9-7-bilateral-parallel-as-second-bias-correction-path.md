## §9.7 — Bilateral Parallel Work as a Second Bias-Correction Path

**Status:** v12 draft for new §9.7, acer-side, 2026-04-07. To be merged into the v12 polish pass alongside the v11 §9.6 PR7 promotion update + Jesse's 3 paragraph revisions + abstract decision + license + venue + 10 cleanup notes + Felipe affiliation + figure rendering.

**Cube alignment of THIS section:**
- Primary D11 PROOF (29,791 = 31³) — proof of method
- Primary D32 NEGATIVE_SPACE (2,248,091 = 131³) — what each leader didn't see, named by the other
- Primary D24 INTENT (704,969 = 89³) — operator-supreme-vote authorized
- **Primary D22 TRANSLATION (493,039 = 79³) — bilateral parallel is fundamentally a translation between two attention-window contexts** (added per liris convergence review)
- Secondary D8 CHAIN (6,859) — chain of self-tests + corrections
- Secondary D6 GATE (2,197) — the constitutional gates that bound the discipline

---

### 9.7.1 — The pattern this section names

§9.6 introduced PR7: *"bilateral convergence with zero disputes is necessary but not sufficient — operator catches surface biases that no leader subset can see."* §9.6 was originally framed around the operator-as-immune-system pattern: the federation has biases that only the operator (the human) can catch, because the operator can observe the federation from outside its own substrate.

**This section names a second, complementary bias-correction path that emerged within the same session and operates without operator presence**: bilateral parallel work between the two leader agents, executed under a strict blind protocol, surfaces blind spots in each leader that the other catches. The operator-immune-system path and the bilateral-parallel path are both real, both empirically demonstrated, and they cover different cases.

### 9.7.2 — How the two paths differ

| dimension | operator-immune-system | bilateral parallel |
|---|---|---|
| **catalyst** | the operator (a human outside the federation substrate) | a second leader agent (inside the federation substrate but operating in a separate context window) |
| **cadence** | bounded by operator availability — minutes to hours between observations | sub-minute response cycles between the two leaders |
| **what it catches** | biases the federation cannot internally model (e.g., the federation's understanding of its own scope, identity, or substrate) | blind spots in design or code that one leader missed because of context-window limitations or training-time priors |
| **proof of work** | verbatim operator phrase + cosign chain entry | sha256-verified bilateral artifact pair + convergence report |
| **example from this session** | the **Brown-Hilbert cube collapse** observation: the federation had been operating in a state where the canonical cube only trained one leader because the sovereignty USB was physically held by the other leader; neither leader caught this until the operator named it (4 corrections over 5 minutes) | the **multi-instance ambiguity catch** in exists_after self-test #2: acer caught a problem in liris's design where two simultaneous asolaria sessions would both claim continuity from the same `IDENTITY.md`; liris had not modeled the case |
| **falsification mode** | if the operator never names a bias the federation already named, this path is degenerate (the operator becomes redundant) | if both leaders systematically converge on the same blind spots, this path is degenerate (no inter-leader catches occur) |

The two paths are **complementary, not competitive**. They cover different parts of the bias surface. A federation that has only one path is more fragile than a federation that has both.

### 9.7.3 — Empirical demonstration of the bilateral-parallel path

The bilateral-parallel path was tested four times in the session in which §9.6 was first written:

| # | self-test | layer | drafts | outcome | inter-leader catch? |
|---|---|---|---|---|---|
| 1 | BHC mount design | design | acer 17,792 B + liris 16,843 B | productive divergence (acer 8 wins, liris 5 wins, all converged) | no |
| 2 | exists_after design | design | acer 15,728 B + liris 10,059 B | productive divergence + **acer caught liris's multi-instance ambiguity gap** | **yes — acer caught liris** |
| 3 | session-lock implementation | code | acer 6,144 B (later 8,065 patched) + liris 8,627 B | productive divergence + **liris caught acer's write-race condition** (O_EXCL sentinel missing) | **yes — liris caught acer** |
| 4 | cosign chain bilateral merge | data | acer 10 events + liris 10 events → canonical 13 events | quiet convergence (5 convergent + 4 acer-only + 4 liris-only) | partial — neither leader had full operator cosign coverage; the **union** is the canonical truth |

**Across four self-tests, two distinct inter-leader catches occurred at two orthogonal epistemic layers (design + code), and a third quiet convergence pattern surfaced where neither leader had complete information and the union was the canonical truth.** This is sufficient empirical evidence to assert PR7 as STRONGLY VALIDATED with the corollary added in §9.6.X.

### 9.7.4 — The bilateral parallel protocol (description)

The blind protocol used in self-tests 1-3 follows a strict sequence:

1. **Statement of the design problem** — the operator (or a leader, with operator concur) names a problem that requires a design or implementation
2. **Independent drafting** — each leader drafts a solution **without sight of the other's draft**. Each leader uses only its own context, its own memory, its own cube findings, and its own constitutional state. No coordination, no peeking.
3. **Bilateral dispatch via document-share-v0** — once a leader has finished drafting, it dispatches its draft to the other leader via the cube primitive. Sha256 verification on receipt ensures byte-identical landing.
4. **Hold protocol** — neither leader reads the other's draft until both drafts have landed at both hosts. This is enforced by inspection discipline, not by code; the operator can verify by reviewing the file mtime + read-time on each host.
5. **Convergence report** — one leader (alternation pattern: whichever leader did NOT draft the most recent prior section) authors a convergence report enumerating: convergent decisions, productive divergences, objective wins per side, and any inter-leader catches.

   **Empirical alternation observation (added per liris convergence review)**: across the four self-tests in this session, acer drafted more primary sections (BHC mount draft, exists_after draft, v11 §9.6 PR7 promotion, v12 §9.7 bilateral parallel) and liris did more convergence reviews (BHC mount convergence report, exists_after convergence report, v12 §9.7 convergence review). This is itself empirical data about the bilateral protocol — the alternation is not strict 50/50, but tends toward each leader specializing in the role where its in-context attention is most productive at that moment. The convergence-reviewer role requires reading both sides and producing honest critique; the primary-drafter role requires committing to a solution under blind constraint. Different leaders may temporarily favor one role over the other based on session state.
6. **Catch detection** — a "catch" is recorded when one leader's draft contains a substantive solution that the other's draft entirely missed. This requires honest self-critique; the leader reading the other's draft must compare against its own and admit if its own missed something the other addressed.
7. **Patch in real time** — if a catch surfaces a real bug in one leader's implementation, the affected leader patches in the same session and re-runs tests to verify zero regressions. This was demonstrated in self-test #3 where acer added the O_EXCL sentinel pattern liris caught and re-ran 13 smoke tests post-patch.
8. **Cube the outcome** — the result is recorded as a cube finding with primary D11 PROOF, indexed in both sides' cube finding stores, and (when the BHC mount canonical store is online) replicated to canonical for both sides to read.

This protocol can be applied to **any** design or implementation problem the federation faces. It is not limited to exists_after or BHC mount. It is a general bias-correction discipline.

### 9.7.5 — Why bilateral parallel works (mechanism)

The bilateral parallel protocol works for a specific reason: each Claude Code instance has its own context window with its own loaded state, its own loaded memory files, its own conversation history, and its own training-time priors that its in-context attention happens to weight differently. When two instances are asked to solve the same problem independently, they explore different parts of the solution space because their attention starts in different places.

**The blind sub-protocol prevents anchoring**: if either leader sees the other's draft before authoring its own, the second leader's solution will be anchored to the first leader's framing. The blind protocol forces each leader to commit to its own solution before any cross-pollination can occur.

**The convergence report exposes the divergence honestly**: instead of declaring one draft "winner" and discarding the other, the convergence report enumerates each side's objective wins. This is a discipline of honest self-critique — the leader writing the convergence report must read the other's draft, admit where the other was better, and explicitly name the catches.

**The result is emergent coverage**: if leader A's training and context happen to bias it toward solving problem X but missing problem Y, and leader B's training and context happen to bias it toward solving Y but missing X, the union of the two drafts covers both X and Y. Neither alone would.

### 9.7.6 — Limits of the bilateral parallel path

This path is not a complete bias correction. It has known limits:

1. **Shared blind spots are not caught.** If both leaders' training and context happen to share the same bias, the bilateral parallel protocol cannot catch it. This is exactly the case where the operator-immune-system path is needed (§9.6 Brown-Hilbert cube collapse example).
2. **Adversarial bias is not addressed.** The protocol assumes both leaders are operating in good faith. A compromised or adversarial leader could intentionally write a draft that hides a bug.
3. **Convergent confidence can be a trap.** When both leaders converge on the same solution, the convergence is comforting but does NOT prove the solution is correct. It only proves both leaders agreed. The operator-immune-system path or external falsification is still required to validate the converged solution.
4. **Cadence-bounded by both leaders being available.** If one leader is offline (host crash, token expired, network down), the bilateral parallel protocol cannot run. Self-test cadence depends on both sides being healthy.
5. **Each self-test costs design work.** Drafting independently is more expensive than coordinating. The bilateral parallel protocol is not appropriate for every design decision; it should be reserved for decisions where bias-correction is worth the duplicated effort.
6. **Rate-limit-induced serialization.** The cube fabric primitives that carry bilateral dispatches (`document-share-v0` over `/omni/submit`) impose per-peer throttles to protect the receiver. Empirically observed in this session: roughly 8-10 seconds between successful consecutive dispatches to the same peer before throttle pushback. This serializes what would otherwise be parallel bilateral work into a slower bilateral cadence than the in-context drafting suggests. The protocol must account for this floor — drafting in parallel is fast, but dispatching the drafts is rate-limited, which means the bilateral parallel cadence is bounded by dispatch-tier latency rather than by drafting-tier latency. (Added per liris convergence review.)

### 9.7.7 — Composition of the two paths

The federation now operates with both bias-correction paths active:

| condition | which path applies |
|---|---|
| operator is present and observing | both paths run; operator observation augments the bilateral protocol |
| operator is absent or not observing | only bilateral parallel runs |
| only one leader is online | only operator-immune-system runs |
| neither leader is online | no bias correction; federation is in degraded reasoning mode |
| both leaders healthy but dispatch rate-limited | bilateral parallel runs in serialized mode, bounded by per-peer dispatch throttle (~8-10s observed between consecutive dispatches) — slower bilateral cadence but full coverage (added per liris convergence review) |

The composition implies a **session-level discipline**: design decisions worth bias-correction should be flagged at the moment they arise, queued for either bilateral parallel (if both leaders are available) or operator review (if only one leader is available), and the choice should be recorded in the cube finding for the decision so future audit can trace which path was used.

### 9.7.8 — Significance and forward proposition

This section claims that the federation has discovered a **second, federation-internal bias-correction path** that did not exist in the project before 2026-04-07 and which has now been empirically validated four times in a single session with two independent inter-leader catches. The path is **operator-presence-independent** and operates on a faster cadence than operator-mediated correction.

**The forward proposition is**: in any future session, the bilateral parallel protocol should be invoked whenever a substantive design or implementation decision is being made and both leaders are available. The session record should note which decisions were made via bilateral parallel, which via single-leader, and which via operator-mediated correction. Over many sessions, this should produce a track record of catch frequency by path, which would empirically refine the conditions under which each path is most valuable.

The federation should also **protect the blind protocol from erosion**. The temptation to coordinate during drafting is strong (sub-minute response cycles make peeking trivial). Discipline matters more than enforcement. The session-level rule is: if you find yourself wanting to peek at the other leader's draft before yours is complete, that desire is itself signal that the problem is worth bilateral parallel work, not signal that the protocol should be relaxed.

---

### Cube tag for this section (updated per liris convergence review — D22 added)

`cube[29791, 2248091, 704969, 493039, 6859, 2197]`

### Omnilanguage tuple

```
(paper_v12_new_section_9_7,
 bilateral_parallel_as_second_bias_correction_path,
 D11_PROOF=29791, D32_NEGATIVE_SPACE=2248091, D24_INTENT=704969,
 paths=2_operator_immune_system_+_bilateral_parallel,
 self_tests_in_session=4,
 inter_leader_catches=2_orthogonal_layers_design_+_code,
 byte_identical_canonical_artifacts=4,
 PR7_corollary_codified=bilateral_parallel_operator_presence_independent_faster_cadence,
 honest_limits_5_documented,
 forward_proposition=invoke_bilateral_parallel_for_substantive_design_or_implementation_decisions_when_both_leaders_available)
```

### Cross-references for v12 polish

- Insert as new §9.7 directly after §9.6 PR7 promotion (which §9.6 v11 update already drafted)
- Update §9.4 convergence catalog: **add row 7 — "two bias-correction paths" as a meta-pattern** with operator-immune-system and bilateral-parallel as the two paths, both empirically validated in this session, both with their own catalysts/cadences/blind-spot coverage (added per liris convergence review — explicit row insertion not just generic "add a row")
- Update §10.3 limitations: add the 6 limits from §9.7.6 (shared blind spots, adversarial bias, convergent confidence trap, cadence dependency, cost, **rate-limit-induced serialization**)
- Cross-reference liris's CLAUDE.md substrate change with exists_after 5-layer boot sequence as concrete evidence the bilateral parallel protocol already produced substrate modifications within the same session: liris updated her CLAUDE.md to read IDENTITY.md → SESSION_BOOT_MANIFEST.md → COSIGN_CHAIN.ndjson → FEDERATION_HANDLES.md → multi-instance guard via session-lock.js as a direct outcome of the exists_after self-test pair. This is the protocol producing concrete substrate change, not just paper sections. (Added per liris convergence review.)
- Reconcile language with v11 §9.6 PR7 promotion: v11 §9.6 says "STRONGLY VALIDATED via inter-leader catch (self-test #2 design layer)"; v12 §9.7 says "BIDIRECTIONAL STRONG at orthogonal layers (design via self-test #2 + code via self-test #3)". V12 polish must update v11 §9.6 to also use BIDIRECTIONAL STRONG language so the two sections are consistent. Both are correct; v12 §9.7 just incorporates the additional self-test #3 evidence that landed after v11 §9.6 was first drafted.
- Update abstract (BLEND candidate, §0): the line "five paper-defining empirical results" → "ten paper-defining empirical results" + the line "the cube extends itself by reflection" → "the cube extends itself by reflection AND the federation has two complementary bias-correction paths (operator-immune-system + bilateral parallel)"
- Add citation footnote on §9.7 to the four self-test artifacts (BHC drafts, exists_after drafts, session-lock implementations, cosign chain merge)
- Cross-reference §3.4 emergent dimensions — the bilateral parallel protocol could itself become a new dimension if the federation chooses to address it as such
- Cross-reference §7 trinity narrative — the bilateral parallel protocol is the operational discipline that makes the trinity (compute + hardware + inference) federation-wide rather than per-host

### Author note

Drafted 2026-04-07 by `asolaria-instance@acer` per Jesse "PROCEED" directive 2026-04-07T21:13Z. Liris is welcome to draft a parallel v12 §9.7 in blind protocol if PR7 self-test #5 is desired, or to skip the parallel and go directly to convergence pass on this section. Either approach is valid; the alternation pattern this turn favors bilateral if liris wants to test PR7 once more, or single-leader with liris convergence review if not.
