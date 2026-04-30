# BEHCS-256 Core Bundle for DEV-ACER

Shipped from liris at 2026-04-18T18:32:10.658Z.

Contents:
  packages/supervisor-registry/   24 supervisor compilers + registry + device + hardware
  packages/omni-router/           glyph-dispatch + router + 22 local OP-* verbs + GUARDSCAN gate
  packages/kernel/                grammar/parser/tokenizer/closure-test + 14 families
  packages/omni-gulp-gc/          GC rotation + Gulp pattern extraction
  packages/omnimets/              mets per-lane telemetry + 6x6x6x6x6x12 convergence engine
  packages/hermes-absorption/prof-hermes-delta.json  133 atoms + calibration data
  kernel/glyph-families.json      canonical BEHCS-256 registry (post-mint 2026-04-18)
  kernel/D11-proof-levels.json    D11 epistemic levels

Install on acer:
  1. Extract to any root, e.g. C:\asolaria-acer\
  2. cd C:\asolaria-acer
  3. npm install tsx (or npx tsx — one-time)
  4. Verify: npx tsx packages/kernel/src/closure-test.ts  (should print ok:true)
  5. Compile supervisors: npx tsx -e "import {refreshAllSupervisors} from './packages/supervisor-registry/src/cache.ts'; console.log(refreshAllSupervisors().length, 'supervisors compiled')"

Apex: COL-ASOLARIA
Authority: COSIGN-MERGED-034
Built-on: liris  Sent-to: acer  Date: 2026-04-18T18:32:10.659Z
