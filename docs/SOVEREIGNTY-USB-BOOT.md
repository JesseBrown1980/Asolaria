# Sovereignty USB Boot — OS-from-Memory-Stick Concept

## What exists today

The sovereignty USB (`E:\`) already has a boot sequence:

```
E:\sovereignty\
  boot.js              ← kernel loader (USB-first, local fallback)
  runtimePaths.js      ← path resolution
  sovereignty-gate.js  ← three-tier promotion gate
  config/              ← colony registry, schemas
  data/                ← canonical cube state
  index/               ← agent index
  ix/                  ← grammar layer
    gates/
      hookwall.js      ← 6-hook gate
      hookwall-v2.js   ← 18-event gate with colony relay
      gnn.js           ← GNN risk + construction routing
      shannon.js       ← remote Shannon consensus
      sovereign.js     ← sovereignty verification
  kernel/              ← core kernel modules
  src/                 ← sovereignty-specific source
  routes/              ← sovereignty-specific routes
  tests/               ← test suite
  research/            ← research artifacts
  contracts/           ← standing directives
```

## How boot.js works

```javascript
// 1. Check ASOLARIA_SOVEREIGNTY_ROOT env var
// 2. If USB mounted → load truth from USB
// 3. If no USB → fall back to local data/
// 4. Load: index kernel, colony registry, selector catalog,
//          transport epochs, draft promotion policy
// 5. Return unified sovereignty state object
```

The USB is already the canonical truth source. The local `C:\Users\acer\Asolaria` is a working copy. When the USB is plugged in, `boot.js` reads from it. When it's not, it degrades gracefully to local state.

## The OS vision

The jump from "agent boots from USB" to "machine boots from USB":

```
CURRENT (agent-level boot):
  Windows starts → npm start → boot.js reads USB → agent has identity

FUTURE (OS-level boot):
  BIOS → USB bootloader → Asolaria kernel → hookwall at BIOS level
  → sovereignty gate before any process starts
  → 47D addressing from first instruction
  → every syscall is a cube-addressed operation
```

### What's needed for OS-level boot

1. **Bootable USB partition** — GRUB/EFI bootloader on the sovereignty USB
2. **Minimal Linux kernel** — just enough to run Node.js + the gate pipeline
3. **Hookwall below the OS** — every process spawn goes through hookwall-v2
4. **Cube-addressed filesystem** — files addressed by their 47D coordinates, not paths
5. **Federation at kernel level** — agent-keyboard channel in the network stack, not userspace

### Why the USB is the right medium

- **Physical sovereignty** — whoever holds the USB controls the boot
- **Rotation protocol** — USB moves between hosts, bilateral state travels with it
- **PID verification** — volume serial 741E5B79, MBR signature 0xA7C09001
- **Offline capable** — the full Brown-Hilbert cube fits on a 2TB USB

## Phone Orbitals

Phones in the federation are **orbital compute nodes** — they orbit the two main hosts (acer + liris) and contribute:

```
PHONE FLEET:
  falcon (Jesse S24 FE)     ← SSH live, Termux, edge compute
  beast (Jesse S22 Ultra)   ← USB MTP only, screen broken
  felipe-a06 (Felipe)       ← Termux, F-Droid, edge compute
  s23-diva (Diva)           ← not provisioned
  xiaomi (liris-side)       ← recovery indexed

ORBITAL CAPABILITIES:
  screen_capture    → D15 DEVICE
  browser_history   → D11 PROOF
  whatsapp          → D22 TRANSLATION
  adb_control       → D37 AUTHORITY_TOPOLOGY
  termux            → D34 COMPUTE_FABRIC (LX-489)
  edge_compute      → D36 INFERENCE_SURFACE
```

Each phone is a `phoneConstructionBridge.js` worker that:
1. Registers as a construction-aware mobile worker
2. Routes phone-initiated messages to the construction pipeline
3. Accepts dispatched tasks for edge processing
4. Feeds activity into GNN tracer observations

The phone fleet is the federation's orbital compute ring. When LX-489 (compute fabric) is fully wired, phone CPUs join the unified addressable fabric alongside acer and liris CPUs.

## Cube alignment

- Primary: D15 DEVICE (103823) — hardware identity
- Primary: D25 TRINITY (912673) — compute+hardware+inference
- Secondary: D34 CROSS_COLONY (2685619) — cross-host dispatch
- Secondary: D44 HEARTBEAT (7189057) — orbital liveness
