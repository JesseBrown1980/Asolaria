# Workflow: Asolaria Index Reconstruction
# Status: ACTIVE
# Started: 2026-03-25
# Owner: Gaia (orchestrator) + Liris (secondary)
# Resume command: "load gaia and the antigravity session to fix asolaria"

## Progress

### Sub-Project 1: ARCHAEOLOGY
- [ ] Install docx parser (mammoth or python-docx)
- [ ] Extract text from all 56 .docx files in Downloads
- [ ] Extract text from "Liris jesse idea..docx" (KEY DOCUMENT)
- [ ] Extract text from "Liris new.docx" (KEY DOCUMENT)
- [ ] Catalog all 76 Antigravity brain sessions (task titles + dates)
- [ ] Investigate .pb protobuf format for conversation extraction
- [ ] Extract all 20 zip snapshots — diff index state at each point in time
- [ ] Build forensic timeline: what was overwritten, when, by whom
- [ ] Identify every broken chain reference
- [ ] Map overwrites to the entries they corrupted

### Sub-Project 2: LEDGER — LIRIS IS BUILDING THIS
- [x] Design append-only entry format (based on gateway-audit.ndjson pattern) — LIRIS DONE: src/indexLedger.js on Rayssa machine
- [ ] Define superseded_by: field for corrections
- [ ] Build CATALOG generator (view from ledger, not hand-edited)
- [ ] Implement chain integrity check at write time
- [ ] Migration script: current index → ledger format

### Sub-Project 3: STAGING / DEV / PROD — LIRIS IS BUILDING THIS
- [x] Create .history/staging/ and .history/dev/ directories — LIRIS DONE on Rayssa machine
- [ ] Define promotion rules (staging → dev: chain check, dev → prod: full anatomy)
- [ ] Build promotion script
- [ ] Build rollback mechanism
- [ ] Test full pipeline with a sample entry

### Sub-Project 4: INTEGRITY ENGINE
- [ ] Chain reference resolver (every chain: target must exist)
- [ ] Frontmatter validator (ix, name, type, tags required)
- [ ] Duplicate number detector
- [ ] Orphan entry finder
- [ ] CATALOG count verifier (disk vs listed)
- [ ] Integration with promotion gate

### Sub-Project 5: RECONSTRUCTION
- [ ] Find earliest zip snapshot (likely Mar 13)
- [ ] Extract clean baseline
- [ ] Replay legitimate additions as appends
- [ ] Flag every overwrite as known corruption
- [ ] Compare clean room vs current prod
- [ ] Jesse reviews delta before swap

## Sources (DO NOT DELETE)
- C:\Users\acer\.gemini\antigravity\brain\ (76 sessions)
- C:\Users\acer\.gemini\antigravity\conversations\ (27 .pb, ~149MB)
- C:\Users\acer\Downloads\*.docx (56 files)
- C:\Users\acer\Downloads\*liris*.zip + *asolaria*.zip (20 files)
- C:\Users\acer\Downloads\*WhatsApp* (43 files)
- C:\Users\acer\Downloads\Liris jesse idea..docx
- C:\Users\acer\Downloads\Liris new.docx
