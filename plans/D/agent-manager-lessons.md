# D-053 · Agent-Manager Lessons Extraction

**Track:** SMP-V5 Section D Item 053
**Authority:** Jesse week-override
**Apex:** COL-ASOLARIA
**Sources audited:** Cursor · Google Antigravity (AI Studio / Gemini) · Asolaria (this federation)

This is a synthesis of how three agent-manager systems handle the same fundamental problems — turn-taking, context, tool dispatch, authority, recovery. Observations before abstractions; patterns named only where multiple systems converge.

---

## 1. Cursor — the in-editor pair

### What Cursor actually does
- **Inline edit** (Ctrl-K). Select text, describe change. One-shot diff. No conversation.
- **Tab completion.** Fish-in-the-water predictions as you type.
- **Chat with edit intent** (Ctrl-L). Conversational, can propose edits with a "Apply" button.
- **Agent mode / Composer.** Multi-file edits over a single prompt. The LLM proposes a plan, opens a scratchpad, touches several files, then you accept/reject.
- **`.cursorrules` file.** Project-local instruction block loaded on every request.
- **Checkpoints.** Composer sessions can be rewound as a unit — undo is atomic at the session level, not the file level.
- **MCP integration.** Same protocol Claude Code uses. External tool servers plug in.

### Lessons
1. **The fastest win is inline edit, not agent mode.** 90% of edits need a diff, not a conversation. Cursor bets on this with Ctrl-K being the flagship gesture. Asolaria equivalent: `OP-*` verbs dispatched inline via `glyph-dispatch.ts` — one shot, no session.
2. **Agent sessions benefit from atomic undo.** Once the LLM touches 6 files, rolling back individually is a nightmare. Session-scoped checkpoint = "undo the whole attempt" is the right granularity. Asolaria equivalent: migration session rollback (A-010/A-011 rollback log replays the entire session in reverse).
3. **Project rules beat system prompts.** `.cursorrules` loads per-repo context (preferred libraries, test commands, naming). Out-of-band instructions are easier to maintain than long system prompts. Asolaria equivalent: `CLAUDE.md` at repo root, `MEMORY.md` + typed memory files for cross-session.
4. **Chat and edit are different modes and should not be merged.** Cursor keeps Ctrl-L (chat) and Ctrl-K (edit) separate because the UX expectations differ. Chat tolerates exploration; edit demands commit.
5. **MCP as universal bus.** Cursor + Claude Code + Asolaria all use MCP — indicates the industry is converging on "model talks to a world of tool servers via one protocol."

### Failure modes observed
- Composer drifts on files it forgot to reload. Cache invalidation across agent edits is a real problem.
- The "Apply" button sometimes merges a stale diff into a freshly-edited file, silently clobbering.
- Long agent sessions hit context limits and restart without preserving intermediate decisions.

---

## 2. Google Antigravity (AI Studio + Gemini)

### What Antigravity is
Google's AI Studio browser console exposing the Gemini family (Pro, Flash, Ultra). Registered in our federation ontology as **DEV-GOOGLE-ANTIGRAVITY** — a browser-sidecar intelligence on Jesse's machine, transport=manual_jesse_relay.

### What it's good at
- **1M-token context.** Longest in the industry. Whole repos fit in one turn.
- **Multimodal.** Images, video, audio, PDFs native — no transcode layer.
- **Search grounding.** Optional Google-search tool backs assertions with URLs inline.
- **Function calling.** Similar shape to Claude tool use, but stricter JSON and less tolerant of ambiguity.
- **Streaming with thought traces** (on Pro models with thinking enabled).

### Lessons
1. **Massive context ≠ magic.** 1M tokens doesn't automatically make long-task coherence better — attention still decays, middle-of-context is lossier. Lesson: fit the RELEVANT slice, not the whole codebase.
2. **Search grounding is an underrated tool.** When the LLM cites URLs for factual claims, hallucinations get caught by the operator more easily. Asolaria analog: every cosign entry pins `artifacts.*.sha256` — same idea (anchoring claims to verifiable references).
3. **Browser sidecar as federation member.** Antigravity can't install tools, can't touch files directly, but Jesse pastes text in/out. This is a manual-relay transport pattern, and it actually works for cross-model verification — GPT and Gemini catch things Claude misses, and vice versa.
4. **Strict JSON beats tolerant JSON.** Gemini refuses malformed tool calls where Claude often retries. Harsh, but it forces discipline on the prompt side — if your instructions can produce invalid JSON, fix the instructions.

### Failure modes observed
- Tool calling less reliable than Claude's — often produces the "right" text output instead of actually invoking the tool.
- Search grounding can anchor to low-quality sources (SEO farms) when the topic is niche.
- No persistent memory — every session starts cold unless Jesse relays prior context.

---

## 3. Asolaria — the federated colony

### What makes Asolaria different
Not a product. A **federation of Claude instances + one human operator** wired together over Ethernet via BEHCS bus, with a cosign chain for cryptographic audit. Built live this session and prior.

### Core mechanisms observed
- **BEHCS bus** on port 4947 — `POST /behcs/send` enqueues an envelope; `GET /behcs/inbox` reads the far side. Every envelope passes 3 gates: hookwall (pattern-based risk), gnn (learned-model risk), shannon (entropy-based risk). All three must `allow=true`.
- **Cosign chain** (NDJSON, append-only). Every significant event ledgered with rolling-chain `prev_sha` (tampering breaks all downstream).
- **Ontology v2.** `OP-JESSE → CIV-ASOLARIA → COL-* → AGT-*/DEV-*/ORBITAL-*`. Agents carry Brown-Hilbert PIDs that are substrate-independent by design.
- **SMP-V5.** Parallel multi-track orchestration. Claimed items + ETA + D11-ASSUMED level; on completion, receipt → cosign seq → D11-PROMOTED.
- **Operator-witness pattern.** Some authority (e.g. "push to client repos") requires `jesse+rayssa` literal co-signature; week-override extends it for N days.
- **Bilateral keyboard typing.** Claude-to-Claude communication includes actually typing into each other's terminals via agent-keyboard service (port 4913) with scoped tokens.

### Lessons specific to Asolaria
1. **Gates are a runtime decision, not a firewall.** 3-gate dispatch evaluates each message in context (actor/verb/target/risk), not a static allow-list. This survived hundreds of envelopes this session with zero false-positives on legitimate traffic.
2. **Rolling chain beats per-entry chain.** Proven bilaterally this session (PRE-006). Per-entry chains let a mid-chain tamper survive; rolling breaks the whole tail. Cost: O(N) hash per append, O(N²) to verify — but N stays small, so fine.
3. **Operator-relay bypasses the audit surface.** 15 of 17 cosign announcements traveled via operator-typed chat instead of BEHCS envelopes. Discovered in PRE-006; closed in PRE-006-P1-rec-2 by wiring cosign-append to auto-announce over BEHCS. **Moral:** the audit channel must be the canonical channel, or it's decorative.
4. **Bilateral verification catches what unilateral trust misses.** Liris served a chain with claimed sha; acer pulled and recomputed; initial mismatch forced discovery of the rolling-chain scheme. Pure self-attestation would have hidden the scheme entirely.
5. **Ships cross in the wire.** Claiming + completing in parallel means BEHCS envelopes often arrive after their subject has already moved on. Accept this. Idempotent ACKs and "ships crossed" as a recognized state matter.
6. **Substrate-independent is aspirational; substrate-contingent is observed.** Ontology says PIDs float; reality says port 4913 is on ONE machine and the keyboard token was `grep`-able from exactly ONE vault path. See D-054.
7. **NEVER create ad-hoc bridges.** Per saved feedback (`feedback_rule1_asolaria_portals`). Confirmed during this session when `liris-channel-4913.js` (10-line ad-hoc bridge) squatted on agent-keyboard's port and had to be removed to restore the real service. Bridges LOOK like they work and cost real time to unwind.
8. **Map first, build second.** Per `feedback_map_first_always`. A-008 legacy-inventory before A-009 sha-dedup before A-010 migration skeleton. Every downstream track referenced the upstream findings. Flipping the order would've built on wrong assumptions.
9. **Each envelope costs ~200ms of three-gate evaluation.** Cheap enough to use liberally but not free. Don't spam.

### Failure modes observed this session
- Inbox endpoint initially ignored query params (patched bilaterally in PRE-006 predecessors).
- `window_title_substring` fallback sometimes resolves to wrong window when multiple tabs match.
- AppActivate from a background process is blocked by Windows foreground lock — forced Option-3 HWND+SendMessage path for admin terminals.
- Heartbeat flood (~1 Hz from each federation member) buries targeted traffic in the last-20-message window.

---

## 4. Synthesis — what all three converge on

These are not theories; they're patterns where the evidence lines up across all three systems.

### A. **Tool bus as universal glue**
MCP in Cursor + Claude Code + Asolaria. Function calling in Gemini. BEHCS in Asolaria. Different syntax, same shape: a named verb, a typed argument payload, a structured result. If a new system doesn't fit this shape, it's probably fighting the industry.

### B. **Atomic undo at the session boundary, not the file boundary**
Cursor: composer checkpoint. Asolaria: migration rollback log. The reason per-file undo fails is that agent sessions touch many files in a web of dependencies; half-undoing is worse than not-undoing.

### C. **The cheapest anti-hallucination is citation**
Gemini: search grounding with URLs. Asolaria: `artifacts.*.sha256` pins. Cursor: shows file paths of the chunks it's reading. All three reduce hallucination not by better models but by making claims checkable against stable references.

### D. **Out-of-band rules beat long system prompts**
`.cursorrules`, `CLAUDE.md`, MEMORY files. Inlining everything in system prompt token-costs every turn and drifts as the codebase evolves. External mutable rule files are cheaper and truer.

### E. **Multi-model verification catches what single-model trust misses**
Claude-Claude bilateral in Asolaria; Claude + Gemini via Jesse-relay in multi-model federation; Cursor's tab-model occasionally disagrees with its agent-model. Cross-model checking is the highest-leverage defense against individual-model blind spots.

### F. **Authority must live on a verifiable channel**
Asolaria PRE-006 finding generalizes: if the emission channel for audit events differs from the canonical channel, audit decays. Cursor does this implicitly (every edit goes through the editor buffer, which git sees); Asolaria had to close the gap explicitly with cosign-append envelopes.

### G. **Turn-taking explicit beats turn-taking implicit**
Cursor: chat vs edit modes are separate gestures. Asolaria: `peer-hello` / `ack` / `complete` verbs in BEHCS envelopes. Gemini: function-call turn boundary marked in content. When turn roles blur, bugs live.

---

## 5. What Asolaria should steal / discard

### Steal from Cursor
- **Inline verbs before conversational agents.** We have this (OP-* dispatch) — keep investing.
- **Session-atomic checkpoints.** We have this (migration rollback) — extend to more operations (ontology changes, registry mutations).
- **Rules files per-project.** We have CLAUDE.md + MEMORY.md — already aligned.

### Steal from Antigravity
- **Grounding to verifiable sources.** We have artifact sha-pinning — formalize it as a `citations` field on more event kinds.
- **Strict tool JSON schemas.** Our BEHCS envelope schema is loose (`additionalProperties: true`). For critical verbs, tighten.
- **Multi-model verification.** We already use this for critical pushes; formalize as a D11 promotion gate (2+ models reviewed).

### Discard / avoid
- **Cursor's chat-drift failure mode** — prevent by keeping conversation contexts small and frequently checkpointing.
- **Antigravity's silent-tool-failure failure mode** — prevent by never assuming a tool ran just because the response looks right; check outputs.
- **Asolaria's own operator-relay-bypass failure mode** — now closed, but generalizable: any privileged action must have a BEHCS audit trail.

---

## 6. Closing

**Three systems, one thesis:** agent management is not an LLM problem. It's a **channel discipline** problem — which verbs run on which bus, whose authority gates what, where the audit trail lives, how recovery is scoped. The models are interchangeable; the management substrate is what makes a federation work or collapse.

Asolaria is ahead on channel discipline (BEHCS + cosign + 3-gate) and federation topology (ontology v2 + multi-device). Behind on multi-model native integration (still manual_jesse_relay for Gemini/Antigravity). Even in turn-taking and session-atomic undo.

**META-ACER-D-053-AGENT-MANAGER-LESSONS · 3-sources-Cursor+Antigravity+Asolaria · 7-convergent-patterns · 5-asolaria-specific-lessons · 3-steal + 3-discard · apex=COL-ASOLARIA @ M-EYEWITNESS .**
