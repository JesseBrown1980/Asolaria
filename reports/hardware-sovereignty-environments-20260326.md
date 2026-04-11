# Hardware Sovereignty — Environment Strategy & Safe Execution Plan

**Date:** 2026-03-26
**Machine:** Acer Nitro AN515-52 (i5-8300H Coffee Lake)

---

## What You Already Have

| Asset | Details |
|-------|---------|
| **Ubuntu 24.04.3 LTS** | WSL2, running, default distro, kernel 6.6.87.2-microsoft-standard-WSL2 |
| **Docker Desktop** | WSL2 backend, running, no containers active |
| **KVM modules loaded** | `kvm_intel` + `kvm` already in memory, **nested virtualization = Y** |
| **Python 3.12** | Available in WSL |
| **Docker** | 29.2.1 in WSL |
| **Git** | 2.43.0 in WSL |
| **Kernel config** | CONFIG_KVM=m, CONFIG_VFIO=m, CONFIG_DEVMEM=y, MODULE_SIG not enforced |
| **Disk 0 (HDD)** | 1TB WDC, D: drive, 745GB free — **staging/dev space** |
| **Disk 1 (NVMe)** | 512GB SSD, C: drive (Windows + WSL) |
| **WSL root FS** | 1TB virtual disk, 954GB free |
| **No QEMU installed** | Needs `apt install qemu-system-x86` |
| **No build-essential** | Needs `apt install build-essential linux-headers-generic` |
| **VT-x in BIOS** | DISABLED — but KVM modules are loaded because WSL2 runs under Hyper-V which provides VT-x to guests |

### Critical Discovery: Nested Virtualization is ON

`/sys/module/kvm_intel/parameters/nested = Y`

This means you can run VMs inside WSL2 right now. WSL2 itself runs under Hyper-V, and Hyper-V is exposing VT-x to the WSL2 VM. You don't need to change BIOS settings to start — you can run QEMU/KVM inside WSL2 with hardware acceleration.

---

## Environment Architecture: 5 Layers, Zero Risk to Host

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 0: YOUR HARDWARE (i5-8300H, read-only observation)   │
│ Tools: chipsec, rdmsr, dmidecode — READ ONLY, no writes    │
├─────────────────────────────────────────────────────────────┤
│ LAYER 1: WINDOWS 11 (your daily driver — NEVER TOUCH)      │
│ Asolaria, QDD, browser, work — protected, unchanged        │
├─────────────────────────────────────────────────────────────┤
│ LAYER 2: WSL2 UBUNTU 24.04 (orchestrator / build host)     │
│ Docker, QEMU/KVM, compilers, chipsec — the control plane   │
├─────────────────────────────────────────────────────────────┤
│ LAYER 3: QEMU/KVM VMs inside WSL2 (DEV + STAGING)          │
│ Full Linux VMs with real kernel, MSR access, module loading │
│ Disposable — snapshot, test, destroy, repeat                │
├─────────────────────────────────────────────────────────────┤
│ LAYER 4: DOCKER CONTAINERS (isolated tool environments)     │
│ chipsec container, build containers, FPGA toolchains        │
│ Even more disposable — rebuild in seconds                   │
└─────────────────────────────────────────────────────────────┘
```

### Environment Mapping

| Environment | Where | Purpose | Destroy OK? |
|------------|-------|---------|-------------|
| **PROD** | Layer 1 (Windows) + Layer 0 (hardware) | Your real machine. Never modified without full validation. | NO |
| **STAGING** | Layer 3 (QEMU VM, "staging" snapshot) | Final validation before touching PROD. Mimics real hardware. | Yes — snapshot rollback |
| **DEV** | Layer 3 (QEMU VM, "dev" snapshot) | Active development. Kernel modules, hypervisor code, experiments. | Yes — destroy and recreate |
| **SANDBOX** | Layer 4 (Docker containers) | Isolated tool runs. Build chipsec, compile kernels, run FPGA tools. | Yes — `docker rm` |
| **OBSERVE** | Layer 2 (WSL2 direct) | Read-only hardware observation via /proc, /sys, dmidecode. | Safe — read only |

---

## Phase 1: Bootstrap (No Installs on Windows, No BIOS Changes)

Everything in WSL2 Ubuntu. Zero risk to Windows.

### Step 1.1: Install Build Tools + QEMU

```bash
# In WSL2 Ubuntu
sudo apt update
sudo apt install -y \
  build-essential \
  linux-headers-generic \
  qemu-system-x86 \
  qemu-utils \
  libvirt-daemon-system \
  virt-manager \
  bridge-utils \
  python3-pip \
  python3-venv \
  nasm \
  ovmf \
  dmidecode \
  hwinfo \
  pciutils \
  usbutils
```

### Step 1.2: Verify KVM Works

```bash
# Should show "kvm acceleration can be used"
kvm-ok 2>/dev/null || grep -c vmx /proc/cpuinfo

# Test QEMU with KVM
qemu-system-x86_64 -accel kvm -nographic -no-reboot \
  -kernel /boot/vmlinuz-* -append "console=ttyS0 panic=1" \
  -m 512 2>&1 | head -20
```

### Step 1.3: Read-Only Hardware Observation (OBSERVE environment)

```bash
# These are all READ-ONLY — zero risk
sudo dmidecode -t bios          # BIOS version, vendor, date
sudo dmidecode -t system        # System manufacturer, model
sudo dmidecode -t processor     # CPU details, VT-x flags
sudo lspci -vvv                 # All PCI devices with full details
sudo lsusb -v                   # All USB devices
cat /proc/cpuinfo               # CPU flags (look for vmx, smx, txt)
cat /sys/devices/system/cpu/vulnerabilities/*  # Spectre/Meltdown status
```

---

## Phase 2: DEV Environment (QEMU VM Inside WSL2)

A full Linux VM running inside WSL2 with its own kernel. You can load modules, crash it, destroy it — WSL2 and Windows are untouched.

### Step 2.1: Create DEV VM

```bash
# Create directory structure
mkdir -p ~/sovereignty/{dev,staging,prod-readouts,tools,images}

# Download minimal Arch Linux ISO (rolling, latest kernel, best for hardware hacking)
wget -O ~/sovereignty/images/archlinux.iso \
  "https://geo.mirror.pkgbuild.com/iso/latest/archlinux-x86_64.iso"

# Create DEV disk (50GB, thin provisioned — only uses space as written)
qemu-img create -f qcow2 ~/sovereignty/dev/dev-disk.qcow2 50G

# Boot DEV VM with KVM acceleration
qemu-system-x86_64 \
  -accel kvm \
  -cpu host \
  -m 4096 \
  -smp 4 \
  -drive file=~/sovereignty/dev/dev-disk.qcow2,format=qcow2 \
  -cdrom ~/sovereignty/images/archlinux.iso \
  -boot d \
  -nic user,hostfwd=tcp::2222-:22 \
  -nographic \
  -bios /usr/share/ovmf/OVMF.fd
```

### Step 2.2: Inside DEV VM — Install and Experiment

```bash
# After Arch install, inside the VM:
pacman -S base-devel linux-headers msr-tools python python-pip git nasm

# Load MSR module
modprobe msr

# Read CPU MSRs (SAFE — read only)
rdmsr 0x1A2    # IA32_TEMPERATURE_TARGET
rdmsr 0x199    # IA32_PERF_CTL
rdmsr 0x610    # MSR_RAPL_POWER_LIMIT
rdmsr 0x13A    # IA32_FEATURE_CONTROL (Boot Guard bits)

# Install chipsec (hardware security audit)
pip install chipsec
python -m chipsec_main    # Full audit — shows what's locked, what's open

# Build a custom kernel module (test in VM first!)
# ... iterate here until it works ...
```

### Step 2.3: Snapshot Management

```bash
# CRITICAL: Snapshot before any risky operation
# From WSL2 (outside the VM):

# Create snapshot
qemu-img snapshot -c "before-msr-writes" ~/sovereignty/dev/dev-disk.qcow2

# List snapshots
qemu-img snapshot -l ~/sovereignty/dev/dev-disk.qcow2

# Rollback if something breaks
qemu-img snapshot -a "before-msr-writes" ~/sovereignty/dev/dev-disk.qcow2

# Delete snapshot
qemu-img snapshot -d "before-msr-writes" ~/sovereignty/dev/dev-disk.qcow2
```

---

## Phase 3: STAGING Environment (Validated DEV → STAGING Promotion)

Same as DEV but with stricter rules. Only code that passed DEV testing gets here.

### Step 3.1: Create STAGING VM

```bash
# Clone DEV disk as STAGING base (or create fresh)
qemu-img create -f qcow2 ~/sovereignty/staging/staging-disk.qcow2 50G

# STAGING runs with more realistic constraints:
qemu-system-x86_64 \
  -accel kvm \
  -cpu host \
  -m 4096 \
  -smp 4 \
  -drive file=~/sovereignty/staging/staging-disk.qcow2,format=qcow2 \
  -nic user,hostfwd=tcp::2223-:22 \
  -nographic \
  -bios /usr/share/ovmf/OVMF.fd
```

### Step 3.2: Promotion Protocol

```
DEV → STAGING promotion checklist:
[ ] Kernel module compiles cleanly (no warnings)
[ ] Module loads without kernel oops/panic in DEV VM
[ ] Module unloads cleanly (rmmod, no dangling references)
[ ] dmesg shows no errors after load/unload cycle
[ ] Tested 10 load/unload cycles without memory leak (check /proc/meminfo)
[ ] MSR read values match expected (cross-reference Intel SDM Vol 4)
[ ] If MSR WRITE: tested write + read-back in DEV VM, value correct
[ ] VM survived 30-minute stress test after module load
[ ] Snapshot taken before STAGING test
[ ] Two independent reviews of the code (you + Claude counts as one — get a second model or human)
```

### Step 3.3: STAGING → PROD Promotion

```
STAGING → PROD promotion checklist:
[ ] All STAGING checklist items passed
[ ] Code reviewed by at least two frontier models (per your existing rule)
[ ] Run in STAGING for 24 hours without intervention
[ ] Full system state documented before PROD application
[ ] Rollback plan documented and tested in STAGING
[ ] If firmware mod: SPI flash backup taken via external programmer
[ ] If firmware mod: crisis recovery procedure verified
[ ] If BIOS setting: current value photographed/recorded
[ ] If BIOS setting: reset procedure documented
```

---

## Phase 4: SANDBOX Environments (Docker for Tools)

### 4.1: chipsec Container

```dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y \
    python3 python3-pip git build-essential \
    linux-headers-generic nasm
RUN pip3 install chipsec
CMD ["python3", "-m", "chipsec_main"]
```

### 4.2: FPGA Toolchain Container (Yosys + nextpnr)

```dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y \
    yosys nextpnr-ice40 nextpnr-ecp5 \
    fpga-icestorm python3 python3-pip git
RUN pip3 install amaranth litex migen
WORKDIR /fpga
CMD ["/bin/bash"]
```

### 4.3: Kernel Module Build Container

```dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y \
    build-essential linux-headers-generic \
    linux-source nasm bc flex bison libelf-dev \
    libssl-dev dwarves
WORKDIR /module
CMD ["/bin/bash"]
```

---

## Phase 5: What Each Environment Can Reach

### From OBSERVE (WSL2 direct, read-only, available NOW)

| What | Command | Risk |
|------|---------|------|
| CPU model & flags | `cat /proc/cpuinfo` | None |
| PCI device tree | `lspci -vvv` | None |
| USB device tree | `lsusb -v` | None |
| BIOS/system info | `sudo dmidecode` | None |
| CPU vulnerabilities | `cat /sys/devices/system/cpu/vulnerabilities/*` | None |
| Kernel config | `zcat /proc/config.gz` | None |
| Memory map | `cat /proc/iomem` | None |
| I/O ports | `cat /proc/ioports` | None |
| ACPI tables | `cat /sys/firmware/acpi/tables/*` | None (may need root) |

### From DEV VM (QEMU, after Phase 2)

| What | Method | Risk to Host |
|------|--------|-------------|
| MSR read/write | rdmsr/wrmsr in VM | **None** — VM MSRs, not real hardware |
| Custom kernel module | insmod in VM | **None** — VM kernel, crash = restart VM |
| Hypervisor experiment | Load HyperDbg/Bareflank in VM | **None** — nested virt |
| chipsec audit | Run in VM | **Limited** — sees VM hardware, not all real hardware |
| Kernel compilation | Custom kernel build + boot | **None** — VM only |
| Crash testing | Intentional kernel panics | **None** — snapshot + restart |

### From STAGING VM (QEMU, after Phase 3)

Same as DEV but with validated code only. The STAGING VM is the "does this actually work reliably" gate.

### From PROD (Real hardware, after Phase 3 STAGING → PROD promotion)

| What | Method | Risk | Mitigation |
|------|--------|------|-----------|
| BIOS VT-x enable | F2 → toggle | **Very low** | Reversible in BIOS |
| Hidden BIOS settings | RU.EFI from USB | **Low** | CMOS reset = defaults |
| MSR reads (real) | Boot Linux USB, rdmsr | **None** | Read-only |
| chipsec audit (real) | Boot Linux USB | **None** | Read-only audit |
| MSR writes (real) | Boot Linux USB, wrmsr | **Medium** | Tested in DEV+STAGING first |
| ME neutralization | CH341A + SPI flash | **Medium-High** | Backup dump first, external programmer = recoverable |
| Custom DXE driver | UEFITool + SPI flash | **High** | Boot Guard may block, backup dump required |

---

## Recommended Execution Order

```
WEEK 1: Bootstrap
  ├── Install QEMU + tools in WSL2 (Step 1.1)
  ├── Verify KVM works (Step 1.2)
  ├── Run OBSERVE read-only commands (Step 1.3)
  └── Create DEV VM with Arch Linux (Step 2.1)

WEEK 2: Learn in DEV
  ├── Install msr-tools, chipsec in DEV VM
  ├── Read MSRs, understand the values
  ├── Write first kernel module (hello world)
  ├── Load/unload cycle testing
  └── Snapshot discipline (snapshot before every experiment)

WEEK 3: Graduate to STAGING
  ├── Promote tested module to STAGING
  ├── 24-hour soak test
  ├── Document what you learned
  └── Decision point: ready for real hardware?

WEEK 4+: PROD (Real Hardware)
  ├── Enable VT-x in BIOS (reversible, low risk)
  ├── Boot Arch Linux USB for real chipsec audit
  ├── Real MSR reads (read-only)
  └── Based on chipsec results: decide ME/UEFI path
```

---

## The Safety Principle

> "We cannot make edits WITHOUT making absolutely sure this will work (we do not want to die mid work)"

The architecture above guarantees this:
- **You never touch real hardware until code has survived DEV → STAGING → review**
- **Every VM has snapshots — instant rollback**
- **Docker containers are ephemeral — destroy and rebuild in seconds**
- **Real hardware changes only happen after the full promotion checklist**
- **Firmware changes require external SPI programmer backup first — always recoverable**
- **The worst case in DEV/STAGING is a VM restart, not a brick**

The only thing that can brick your machine is a bad SPI flash write without a backup dump. As long as you follow the protocol (read twice, diff, backup before write), even firmware modification is recoverable.

---

*Generated 2026-03-26 — Claude Opus 4.6*
