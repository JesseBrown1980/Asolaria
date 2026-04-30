# cycle-orchestrator-v2 · RECOMMENDED SPEC
Derived from 50k Opus + 50k Gulp reverse-gain-sieved fanout.
D11=ASSUMED · awaits bilateral ratification via UNISON-PROCESSOR.

## stateMachine
Top-5 design variants (sieve-in, reverse-gain-scored):
  1. angle=runtime-model · failure=masquerade · intent=leak · score=1.150
  2. angle=runtime-model · failure=fingerprint-mismatch · intent=leak · score=1.150
  3. angle=architecture · failure=restart-mid-cycle · intent=leak · score=1.100
  4. angle=architecture · failure=slo-red-flapping · intent=leak · score=1.100
  5. angle=runtime-model · failure=peer-outage · intent=leak · score=1.050

## unisonTestDriver
Top-5 design variants (sieve-in, reverse-gain-scored):
  1. angle=data-flow · failure=schema-evolution · intent=leak · score=1.160
  2. angle=data-flow · failure=drift · intent=leak · score=1.160
  3. angle=observability · failure=fingerprint-mismatch · intent=leak · score=1.110
  4. angle=observability · failure=masquerade · intent=leak · score=1.110
  5. angle=data-flow · failure=slo-red-flapping · intent=leak · score=1.060

## fingerprintTracker
Top-5 design variants (sieve-in, reverse-gain-scored):
  1. angle=resume-from-state · failure=thundering-herd · intent=leak · score=1.170
  2. angle=resume-from-state · failure=peer-outage · intent=leak · score=1.170
  3. angle=error-path · failure=schema-evolution · intent=leak · score=1.120
  4. angle=error-path · failure=drift · intent=leak · score=1.120
  5. angle=resume-from-state · failure=fingerprint-mismatch · intent=leak · score=1.070

## gnnFeedback
Top-5 design variants (sieve-in, reverse-gain-scored):
  1. angle=runtime-model · failure=slo-red-flapping · intent=leak · score=1.180
  2. angle=runtime-model · failure=restart-mid-cycle · intent=leak · score=1.180
  3. angle=architecture · failure=thundering-herd · intent=leak · score=1.130
  4. angle=architecture · failure=peer-outage · intent=leak · score=1.130
  5. angle=runtime-model · failure=drift · intent=leak · score=1.080

## sloGate
Top-5 design variants (sieve-in, reverse-gain-scored):
  1. angle=data-flow · failure=masquerade · intent=leak · score=1.190
  2. angle=data-flow · failure=fingerprint-mismatch · intent=leak · score=1.190
  3. angle=observability · failure=restart-mid-cycle · intent=leak · score=1.140
  4. angle=observability · failure=slo-red-flapping · intent=leak · score=1.140
  5. angle=data-flow · failure=peer-outage · intent=leak · score=1.090

## Halt predicates status
  U-006-mem: PASS
  U-007-err-10pct: PASS
  U-008-op-halt: PASS
  U-010-schema-drift: PASS

## Next
1. Liris + Falcon re-execute SAME 100k fanout deterministically (BEHCS-256 glyph-only).
2. Both sides emit shape_fingerprint of design-variants-reduced.json canonical bytes.
3. Bilateral match → EVT-UNISON-MATCH → promote ORCH-V2 spec to D11=OBSERVED.
4. Build packages/cycle-orchestrator from ratified spec.
5. Start in background, lock fleet into self-sustaining cycle.