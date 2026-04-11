# SOVEREIGNTY PROJECT — POST-REBOOT INSTRUCTIONS

## READ THIS FIRST

Jesse just rebooted to enable VT-x in BIOS. This file tells you exactly where everything is and what to do next.

## WHAT HAPPENED BEFORE REBOOT

1. 10 research agents audited hardware sovereignty paths for Jesse's Acer Nitro AN515-52 (i5-8300H Coffee Lake, Insyde V1.28)
2. QEMU 8.2.2, KVM, build tools, msr-tools all installed in WSL2 Ubuntu 24.04
3. Project structure created at `~/sovereignty/` inside WSL2 (run `wsl -d Ubuntu -- ls ~/sovereignty/`)
4. Safety protocol, test runner, promotion gates all written
5. Test suite passed 5/5
6. **Critical finding: WSL2 cannot access real hardware** — Hyper-V virtualizes everything. WSL2 is for building tools only. Real hardware requires bare-metal Linux boot.

## WHAT JESSE DID IN BIOS

Enabled: **Intel Virtualization Technology (VT-x)**
Path: F2 → Advanced → CPU Configuration → Intel Virtualization Technology → Enabled → F10 Save & Exit

## VERIFY VT-x FIRST

Run this immediately:
```bash
wsl -d Ubuntu -- grep -c vmx /proc/cpuinfo
```
Expected: a number > 0 (probably 16). If 0, VT-x did not enable — Jesse needs to reboot and check BIOS again.

## WHAT TO DO NEXT (Phase 1: Bootable USB)

### Step 1: Download Ventoy + Ubuntu ISO in WSL2

```bash
wsl -d Ubuntu -- bash -c "
mkdir -p ~/sovereignty/images
cd ~/sovereignty/images

# Download Ventoy (multi-boot USB manager)
wget -q https://github.com/ventoy/Ventoy/releases/download/v1.0.99/ventoy-1.0.99-linux.tar.gz
tar xzf ventoy-1.0.99-linux.tar.gz

# Download Ubuntu 24.04 live ISO
wget -q --show-progress https://releases.ubuntu.com/24.04.3/ubuntu-24.04.3-desktop-amd64.iso
"
```

NOTE: The Ubuntu ISO is ~6GB. If bandwidth is limited (Jesse has had internet issues), check if he already has an ISO in Downloads.

### Step 2: Ask Jesse to plug in a USB stick (8GB+ minimum)

Then identify it:
```bash
wsl -d Ubuntu -- sudo fdisk -l | grep -E '/dev/sd[b-z]'
```

### Step 3: Install Ventoy on the USB

```bash
# DANGER: This wipes the USB stick. Confirm the device letter with Jesse.
wsl -d Ubuntu -- sudo ~/sovereignty/images/ventoy-1.0.99/Ventoy2Disk.sh -i /dev/sdX
```

### Step 4: Copy ISO to Ventoy USB

```bash
# Mount and copy
wsl -d Ubuntu -- bash -c "
sudo mount /dev/sdX1 /mnt
sudo cp ~/sovereignty/images/ubuntu-24.04.3-desktop-amd64.iso /mnt/
sudo umount /mnt
"
```

### Step 5: Boot from USB (requires another reboot)

1. Shut down
2. Power on, press **F12** for boot menu
3. Select the USB stick
4. Choose "Try Ubuntu" (do NOT install)

### Step 6: Run read-only hardware map from live USB

```bash
# ALL READ-ONLY — zero risk
sudo modprobe msr

echo "=== BOOT GUARD STATUS ==="
sudo rdmsr 0x13A          # IA32_FEATURE_CONTROL — Boot Guard bits

echo "=== CPU FEATURES ==="
grep -E 'vmx|smx|txt' /proc/cpuinfo | head -1

echo "=== TEMPERATURE ==="
sudo rdmsr 0x1A2          # IA32_TEMPERATURE_TARGET

echo "=== POWER LIMITS ==="
sudo rdmsr 0x610          # MSR_RAPL_POWER_LIMIT

echo "=== UNDERVOLT LOCK ==="
sudo rdmsr 0x150 2>&1     # OC Mailbox — if GP fault, it's locked

echo "=== UEFI VARIABLES ==="
ls /sys/firmware/efi/efivars/ | wc -l

echo "=== UEFI BOOT ENTRIES ==="
sudo efibootmgr -v

echo "=== FULL PCI TOPOLOGY ==="
sudo lspci -vvv > ~/pci-full.txt
echo "Saved to ~/pci-full.txt"

echo "=== IOMMU STATUS ==="
sudo dmesg | grep -i iommu

echo "=== BIOS INFO ==="
sudo dmidecode -t bios

echo "=== SYSTEM INFO ==="
sudo dmidecode -t system

echo "=== ME STATUS ==="
sudo dmesg | grep -i 'mei\|management engine'
```

Save ALL output:
```bash
# Run the whole block above piped to tee:
# script ~/hardware-map-$(date +%Y%m%d).txt
# [run commands]
# exit
# Then copy the file to USB or Windows partition
```

## WHERE EVERYTHING IS

| What | Path |
|------|------|
| Full audit report | `C:\Users\acer\Asolaria\reports\hardware-sovereignty-audit-20260326.md` |
| 6-agent opinion synthesis | `C:\Users\acer\Asolaria\reports\sovereignty-opinions-synthesis-20260326.md` |
| Memory (for future agents) | `C:\Users\acer\.claude\projects\C--\memory\project_sovereignty_status.md` |
| Dan's feedback | `C:\Users\acer\.claude\projects\C--\memory\project_sovereignty_dan_feedback.md` |
| WSL2 project dir | WSL2: `~/sovereignty/` (dev, staging, tests, SAFETY.md) |
| Safety protocol | WSL2: `~/sovereignty/SAFETY.md` |
| Test runner | WSL2: `~/sovereignty/tests/run_tests.sh` |
| Promotion gates | WSL2: `~/sovereignty/tests/promote.sh` |
| Experiment logger | WSL2: `~/sovereignty/tests/log_experiment.sh` |
| This file | `C:\Users\acer\Desktop\SOVEREIGNTY-REBOOT-INSTRUCTIONS.md` |
| Jesse↔Dan conversation | `C:\Users\acer\Downloads\Request.docx` |
| Zip audit (completed) | See TASKS.md in Asolaria |

## KEY RULES (from SAFETY.md)

1. **NEVER skip environments** — DEV → STAGING → PROD, no shortcuts
2. **SNAPSHOT before every experiment** in VMs
3. **READ before WRITE** — every MSR/register, read first, document, then write
4. **Real hardware = read-only** until STAGING passes
5. **Two reviews before PROD** (two frontier models or model + human)
6. **Firmware = CH341A backup first** — NEVER write SPI without verified backup

## WHAT NOT TO DO

- Do NOT run chipsec write operations from WSL2 (fake readings)
- Do NOT attempt SPI flash operations without CH341A + backup
- Do NOT modify BIOS settings beyond VT-x without documenting current values
- Do NOT install Linux to disk yet — live USB first
- Do NOT skip the Boot Guard check — it determines everything about the firmware path

## DECISIONS PENDING (for Jesse)

1. Does he have a USB stick (8GB+) for the live boot?
2. Does he want to order CH341A + SOIC clip now (~$10)?
3. Should we contact the Russian hardware expert for Insyde V1.28 flash layout?
4. Internet stability — can he download a 6GB ISO or does he need a lighter distro?

## CONTEXT

- Jesse's daily driver laptop — cannot brick it
- QDD client work and Asolaria colony are running on this machine
- Dan Edens (IoT/firmware engineer) is available for hardware questions
- Jesse knows someone in Russia with hardware/firmware company
- Home internet has been unstable (neighbor wifi situation from earlier sessions)
