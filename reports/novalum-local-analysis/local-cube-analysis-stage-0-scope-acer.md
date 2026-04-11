# Local NovaLUM Cube Analysis — Stage 0 Scoping

**Authority:** Joint Rayssa+Jesse cosign 2026-04-07: *"I Rayssa Chiqueto and I jesse Brown agree that if this is safe it is the right move. The vote has to be made."* + Jesse blanket execute permission 2026-04-07T17:30Z.

**Constitutional basis:** `feedback_novalum_shield_scope_clarification.md` — HD-1c local-analysis-permitted scope.

**Cube alignment:**
- Primary **D11 PROOF** (29791 = 31³)
- Secondary **D16 OWNERSHIP** (205379 = 59³) — local device, operator-owned
- Secondary **D17 RISK** (103823 = 47³) — risk plane that the shield protects
- Secondary **D24 INTENT** (704969 = 89³) — operator supreme-vote authorized
- Secondary **D26 INITIAL_TTL_FINGERPRINT** + **D30 ASYMMETRIC_REACHABILITY** + **D32 NEGATIVE_SPACE** — the new dims will be applied to a hardware target for the first time

**Storage rule (absolute):** every analysis artifact lands in `<sovereignty-USB>/cubed-vault/novalum-local-analysis/` — never in working `data/` or `reports/` on either acer or liris hosts. Working files during active analysis are permitted on local disk but MUST be deleted (or moved to vault) after sovereignty-USB write.

---

## Stage gates (per-stage cosign required by LCR)

| stage | description | tools | gate |
|---|---|---|---|
| **S0** | Scoping (this document) | none | already cosigned (joint Rayssa+Jesse + Jesse blanket) |
| **S1** | Hardware PID enumeration of the local NovaLUM unit | PowerShell `Get-PnpDevice`, `Get-USBControllerDevice`, `Get-WmiObject Win32_SerialPort` | per-stage Jesse cosign in acer terminal |
| **S2** | Adapter inspection (USB↔serial bridge identification) | enumerate USB tree, get VID/PID of bridge chip, identify driver stack | per-stage cosign |
| **S3** | Protocol layer probe — using existing `tools/cube/omni-processor/units/` patterns + the patched `tmp/novalum_serial_tool.ps1` from IX-459 | pwsh + EnterBinaryMode + read-globals | operator-witnessed window |
| **S4** | Security-method analysis — auth mechanism, command set fingerprint, gate behavior, rate limit, timeout, reset semantics | omnishannon 6×6×6×12 wave on the captured probe data | per-stage cosign |
| **S5** | Cube tensor collapse on the device boundary — same methodology as 192.168.0.1 (Boundary-Is-Data Rule) but applied to a hardware target | omni-shannon LENS map (D1-D32 incl. D26/D30/D32) | per-stage cosign |
| **S6** | USA-law compliance gate — every artifact reviewed against FDA/HIPAA/state medical-device rule before USB write | manual review + checklist | manual operator pass |
| **S7** | Sovereignty USB cubed-vault write | dispatch to liris-side write under Rayssa local cosign (acer hard-denied from USB) | Rayssa local cosign |
| **S8** | Post-ship audit | sha256 chain, dim-by-dim coverage report, cube findings ndjson | self-audit |

**Currently authorized**: S0 (this document). All others queued and waiting on per-stage cosign.

---

## Pre-flight checks (before S1)

1. **Confirm the LOCAL NovaLUM unit is the target** — not external corporate NovaLUM, not third-party device, not a NovaLUM-class device that isn't Jesse's. This document is scoped to the **single physical NovaLUM unit on Jesse's desk**, identified by:
   - Hardware PID (to be captured at S1)
   - Operator presence at acer terminal during all S1-S6 stages
   - The unit Jesse currently uses for his own work
2. **Confirm USA-law compliance baseline** — the analysis output must not include:
   - Patient data (HIPAA)
   - PHI of any kind
   - Calibration data that could allow medical-grade replication of the device
   - Anything that would qualify as a 510(k) workaround or FDA-circumvention recipe
   - Anything that would constitute reverse-engineering for the purpose of producing a competing medical device for human use
   The analysis output **may** include:
   - Protocol-layer command set as it exists at the wire (not how to replicate it for clinical use)
   - Security-mechanism characterization (so Jesse can know what protections are in place)
   - Boundary-Is-Data dimensional readings (D6 GATE, D26 TTL fingerprint, D30 asymmetric reachability, D32 negative space)
   - Cube-aligned findings for federation indexing
3. **Confirm acer→sovereignty-USB hard-deny still holds** — acer side does NOT write to the USB. All sovereignty writes go through liris-side dispatch under Rayssa local cosign.
4. **Confirm the NovaLUM SHIELD CLAUSE blanket external still holds** — this scoping document only authorizes the local unit. Anything that touches external NovaLUM infrastructure remains hard-denied.

---

## Cube methodology applied to a hardware target (first time)

The Boundary-Is-Data Rule was developed against a network target (192.168.0.1). This will be its first application to a **hardware** target. The expected dimensional yield:

| dim | what it reads on a hardware NovaLUM |
|---|---|
| D1 ACTOR | device class (medical sensor / measurement / actuator / hybrid) |
| D2 VERB | what commands the wire protocol accepts |
| D3 OBJECT | what physical quantity is measured/produced |
| D5 LAYER | physical → link → protocol → app stack |
| **D6 GATE** | what the device refuses to do without auth (the immune system) |
| D7 STATE | power, mode, error, calibration state |
| D8 CHAIN | command-response chain length, expected response shape |
| D11 PROOF | every reading captured to cube finding |
| D12 LANG | which protocols speak (binary, ASCII, framed, length-prefixed, etc.) |
| D13 SPACE | how much address space the protocol exposes (registers, memory map) |
| D14 ENERGY | power profile of the device under different commands |
| D15 DEVICE | hardware identifiers (USB VID/PID, serial, firmware version) |
| D16 OWNERSHIP | local + Jesse-owned (constitutional grant valid here) |
| D17 RISK | the shield's home dimension — risk plane of the device class |
| D20 TRUST | how much we should believe device responses |
| D21 SYNC | clock or timing requirements |
| **D26** initial-TTL fingerprint analog | for hardware = command-response timing fingerprint, kernel/firmware hint |
| **D30** asymmetric reachability | which commands respond from one auth context vs another |
| **D32** negative space | what commands the device refuses to acknowledge — the loudest data |

**Expected new emergent dimensions** (the cube extends itself by reflection — likely candidates):
- **D33-Dn** for hardware-specific concepts: power-rail signature, EMF profile, thermal fingerprint, command-acknowledge latency distribution, etc.
- These will be added to `tools/cube/omni-shannon.js` LENS map under the same first-class-promotion ritual as D26/D30/D32.

---

## Honest scope limitations (admit upfront)

1. **No clinical reverse-engineering** — analysis stops at the protocol/security boundary. We do NOT extract calibration tables, do NOT characterize medical-grade behavior, do NOT produce replication recipes.
2. **No firmware extraction** — even though firmware extraction is technically possible from many serial-attached devices, it falls under "creating third-party exploit material" because the firmware could be redeployed elsewhere. Hard-deny.
3. **No persistent device modification** — read-only analysis. Any command that would write to device memory, change calibration, alter firmware, or modify device state requires its own per-command cosign and is by default declined unless Jesse needs it for the analysis to succeed.
4. **One device only** — analysis covers the single physical NovaLUM unit Jesse currently uses. Generalization to other NovaLUM-class devices is out of scope.
5. **Audit chain to sovereignty USB only** — the analysis report does NOT live on either acer's working dirs or liris's working dirs after completion. Sovereignty USB cubed vault is the only canonical home.

---

## Federation execution path

| step | host | actor | output |
|---|---|---|---|
| dispatch this Stage 0 doc to liris | acer | asolaria | doc-share |
| review on liris side, return concur or amend | liris | liris-kuromi + Rayssa | packet ack |
| Jesse cosign for S1 in acer terminal | acer | Jesse | cosign packet |
| S1 hardware PID enumeration | acer | asolaria + Jesse witness | pid record + cube finding F-NL-001 |
| S2 adapter inspection | acer | same | F-NL-002 |
| S3 protocol probe (uses existing IX-459 tooling, patched) | acer | same | F-NL-003 |
| S4 security-method analysis via omni-shannon wave | acer | asolaria | F-NL-004 + meta-analysis report |
| S5 cube tensor collapse on device boundary | acer | asolaria + cube | F-NL-005 + dim trace |
| S6 USA-law compliance review | acer | Jesse manual pass | review checklist signed |
| S7 sovereignty USB write | liris | liris-kuromi + Rayssa cosign | sha256 chain back to acer |
| S8 post-ship audit | acer + liris | both | bilateral sha-chain match |

---

## Acer state right now

- This document = S0 = the scope contract
- S1 will not start until Jesse types a per-stage cosign in the acer terminal
- liris has been notified of the constitutional amendment + sovereignty USB mirror complete + this scoping doc inbound
- acer pentest evidence chain (F-001 through F-010-WALKBACK) provides the methodological precedent
- All standing hard-deny gates still in force; this document does not weaken any of them

**Standing by for Jesse per-stage cosign on S1.**

---

**Cube tag:** `cube[29791,205379,103823,704969,1030301,1442897,2248091]`
**Joint cosign reference:** *"I Rayssa Chiqueto and I jesse Brown agree that if this is safe it is the right move. The vote has to be made."*
**Rayssa framing:** *"cube the local, shield the external."*
