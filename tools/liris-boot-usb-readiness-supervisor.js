#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const downloadsRoot = path.join(process.env.USERPROFILE || 'C:/Users/acer', 'Downloads');

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noDownloads: true,
  noInstall: true,
  noFormat: true,
  noChkdskFix: true,
  noBootRepairWrites: true,
  noDiskpartWrites: true,
  noUsbMutation: true,
  noProcessLaunch: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  state: rel('data/behcs/state/recovery/liris-boot-usb-readiness.state.json'),
  plan: rel('data/recovery/liris-boot-usb-readiness.v1.json'),
  hermes: rel('data/behcs/hermes/recovery/liris-boot-usb-readiness-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/recovery/liris-boot-usb-readiness-consensus-latest.json'),
  cube: rel('data/behcs/cubes/liris-boot-usb-readiness-supervisor.cube.js'),
  reportJson: rel('reports/liris-boot-usb-readiness-latest.json'),
  reportMd: rel('reports/liris-boot-usb-readiness-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeText(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, data.endsWith('\n') ? data : `${data}\n`, 'utf8');
}

function appendNdjson(filePath, data) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
}

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function gib(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round((n / 1024 / 1024 / 1024) * 10) / 10;
}

function statfs(root) {
  try {
    const stats = fs.statfsSync(root);
    const totalBytes = Number(stats.blocks) * Number(stats.bsize);
    const freeBytes = Number(stats.bavail) * Number(stats.bsize);
    return {
      root,
      ok: true,
      totalGiB: gib(totalBytes),
      freeGiB: gib(freeBytes),
      freePercent: totalBytes ? Math.round((freeBytes / totalBytes) * 1000) / 10 : null
    };
  } catch (error) {
    return { root, ok: false, error: error.message };
  }
}

function walk(root, predicate, maxEntries = 30000) {
  const results = [];
  const stack = [root];
  let seen = 0;
  while (stack.length && seen < maxEntries) {
    const current = stack.pop();
    seen += 1;
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (predicate(fullPath, entry.name)) {
        let stat = null;
        try {
          stat = fs.statSync(fullPath);
        } catch (_) {
          stat = null;
        }
        results.push({
          path: fullPath,
          sizeBytes: stat ? stat.size : null,
          sizeMiB: stat ? Math.round((stat.size / 1024 / 1024) * 10) / 10 : null,
          lastWriteTime: stat ? stat.mtime.toISOString() : null
        });
      }
      if (results.length >= 120) break;
    }
  }
  return { results, truncated: seen >= maxEntries };
}

function buildPlan(generatedAt) {
  const bootAssetScan = walk(downloadsRoot, (fullPath, name) => {
    const lower = name.toLowerCase();
    return lower.endsWith('.iso') ||
      lower.includes('ventoy') ||
      lower.includes('win11') ||
      lower.includes('win10') ||
      lower.includes('windows') ||
      lower.includes('recovery');
  });
  const isoAssets = bootAssetScan.results.filter((entry) => entry.path.toLowerCase().endsWith('.iso'));
  const ventoyAssets = bootAssetScan.results.filter((entry) => entry.path.toLowerCase().includes('ventoy'));
  const usbMounted = fs.existsSync('E:/');

  return {
    planId: 'liris-boot-usb-readiness.v1',
    generatedAt,
    status: 'BOOT_RECOVERY_PLAN_READY_USB_MUTATION_BLOCKED',
    mode: MODE,
    incident: {
      machine: 'Liris',
      stopCode: 'INACCESSIBLE_BOOT_DEVICE',
      bugcheck: '0x7B',
      meaning: 'Windows boot reached the OS path but cannot access the Windows boot/system volume.',
      likelyCauses: [
        'BIOS/UEFI storage-controller mode changed between RAID/RST and AHCI',
        'BCD or EFI boot files are damaged',
        'filesystem damage on the Windows volume',
        'bad update or missing storage driver',
        'failing SSD/HDD or loose storage connection'
      ],
      notAssumed: [
        'not proof that all Windows files are destroyed',
        'not safe to fix by repeatedly changing random BIOS settings',
        'not safe to run destructive repair against the wrong disk'
      ]
    },
    hostEvidence: {
      volumes: [statfs('C:/'), statfs('D:/')],
      usb: {
        observedDiskNumber: 2,
        friendlyName: 'General UDisk',
        busType: 'USB',
        partitionStyle: 'MBR',
        healthStatus: 'Healthy',
        partitionDriveLetter: 'E',
        partitionType: 'IFS',
        partitionSizeBytes: 536870912000,
        partitionSizeGiB: gib(536870912000),
        mountedInWindows: usbMounted,
        chkdskReadOnlyFinding: {
          fileSystem: 'exFAT',
          label: 'SOVLINUX',
          result: 'critical_error_volume_bitmap_corruption',
          windowsAdvice: 'run CHKDSK with /F',
          supervisorDecision: 'do_not_run_chkdsk_f_without_operator_approval'
        }
      },
      bootMediaAssets: {
        downloadsRoot,
        isoAssetsFound: isoAssets.length,
        ventoyAssetsFound: ventoyAssets.length,
        assets: bootAssetScan.results.slice(0, 80),
        scanTruncated: bootAssetScan.truncated
      }
    },
    hardBlocks: [
      'Do not format or repartition the SOVLINUX USB until its data value is decided.',
      'Do not run chkdsk E: /f until operator approves mutating the USB filesystem.',
      'Do not run Ventoy2Disk on the SOVLINUX USB unless it is approved to overwrite it.',
      'Do not run bootrec, bcdboot, diskpart write operations, or chkdsk /f on Liris until the correct Windows and EFI volumes are identified.'
    ],
    immediateHumanSteps: [
      'Photograph the Liris BSOD and any BIOS storage setting before changing anything.',
      'Stop the reboot loop if possible and enter BIOS/UEFI.',
      'Check whether storage mode was changed. If it was switched between RAID/RST and AHCI, set it back to the mode Windows was installed with.',
      'Prefer a separate known-good 16GB+ USB for Windows recovery media so the SOVLINUX USB can be preserved.',
      'If SOVLINUX may be sacrificed, install Ventoy or Windows recovery media only after explicit approval.'
    ],
    winReRepairSequence: [
      {
        stage: 'bios_storage_mode_check',
        command: 'BIOS/UEFI only',
        purpose: 'Verify controller mode before touching disks. 0x7B commonly follows RAID/RST/AHCI mismatch.'
      },
      {
        stage: 'identify_windows_and_efi_volumes',
        command: 'diskpart -> list vol -> exit',
        purpose: 'Find the Windows volume letter and EFI System Partition letter in WinRE.'
      },
      {
        stage: 'filesystem_check_after_volume_identity',
        command: 'chkdsk <WindowsLetter>: /f',
        purpose: 'Repair the Windows filesystem only after the Windows volume is positively identified.'
      },
      {
        stage: 'offline_system_file_check',
        command: 'sfc /scannow /offbootdir=<SystemLetter>:\\ /offwindir=<WindowsLetter>:\\Windows',
        purpose: 'Check Windows files offline without booting the damaged install.'
      },
      {
        stage: 'bcd_scan',
        command: 'bootrec /scanos && bootrec /rebuildbcd',
        purpose: 'Recover boot configuration if Windows is visible.'
      },
      {
        stage: 'uefi_boot_rebuild_if_needed',
        command: 'bcdboot <WindowsLetter>:\\Windows /s <EfiLetter>: /f UEFI',
        purpose: 'Recreate UEFI boot files after the correct EFI partition is assigned a temporary letter.'
      }
    ],
    decision: isoAssets.length > 0
      ? 'ISO_AVAILABLE_BOOT_MEDIA_CAN_BE_PREPARED_AFTER_USB_CHOICE'
      : 'NO_WINDOWS_ISO_FOUND_USE_RECOVERYDRIVE_OR_DOWNLOAD_ISO_BEFORE_BOOT_USB'
  };
}

function buildHermes(plan, generatedAt) {
  return {
    integrationId: 'liris-boot-usb-readiness-hermes-dispatch',
    generatedAt,
    status: plan.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-LIRIS-BOOT-USB-READINESS',
      summary: 'Liris 0x7B boot recovery is planned; SOVLINUX USB is detected but mutation is blocked.',
      stopCode: plan.incident.stopCode,
      bugcheck: plan.incident.bugcheck,
      usbLabel: plan.hostEvidence.usb.chkdskReadOnlyFinding.label,
      usbFinding: plan.hostEvidence.usb.chkdskReadOnlyFinding.result,
      isoAssetsFound: plan.hostEvidence.bootMediaAssets.isoAssetsFound,
      ventoyAssetsFound: plan.hostEvidence.bootMediaAssets.ventoyAssetsFound,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(plan, generatedAt) {
  return {
    integrationId: 'liris-boot-usb-readiness-shannon-consensus',
    generatedAt,
    status: 'consensus_recovery_plan_ready_mutation_blocked',
    consensus: 'HALT-USB-MUTATION-PREPARE-BOOT-RECOVERY',
    executionDisposition: 'no_format_no_chkdsk_f_no_ventoy_write_no_boot_repair_write',
    votes: [
      { part: 'scout', vote: 'PLAN_READY', reason: 'The stop code and local USB state were captured from read-only evidence.' },
      { part: 'evidence', vote: 'USB_UNREADABLE', reason: 'Windows sees SOVLINUX as exFAT but reports volume-bitmap corruption and does not mount E:.' },
      { part: 'executor', vote: 'HALT_MUTATION', reason: 'Repairing, formatting, or installing Ventoy would mutate the USB and requires explicit operator approval.' },
      { part: 'fabric', vote: 'RECOVERY_SEQUENCE_READY', reason: 'WinRE BIOS/storage, volume identity, filesystem, SFC, BCD, and UEFI rebuild sequence is documented.' },
      { part: 'voice', vote: 'PRESERVE_EVIDENCE', reason: '0x7B is a boot-device access fault, not proof of total Windows destruction.' },
      { part: 'planner', vote: plan.hostEvidence.bootMediaAssets.isoAssetsFound > 0 ? 'ISO_AVAILABLE' : 'NEED_ISO_OR_RECOVERYDRIVE', reason: plan.decision }
    ]
  };
}

function buildCube(plan, shannonPacket, generatedAt) {
  const cube = {
    id: 'liris-boot-usb-readiness-supervisor',
    generatedAt,
    primaryCatalog: { D: 47, name: 'BOUNDARY', prime: 211 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['no_usb_mutation', 'no_diskpart_write', 'no_boot_repair_write', 'operator_approval_required'],
    payload: {
      kind: 'boot-recovery-readiness',
      status: plan.status,
      stopCode: plan.incident.stopCode,
      bugcheck: plan.incident.bugcheck,
      usbFinding: plan.hostEvidence.usb.chkdskReadOnlyFinding.result,
      isoAssetsFound: plan.hostEvidence.bootMediaAssets.isoAssetsFound,
      ventoyAssetsFound: plan.hostEvidence.bootMediaAssets.ventoyAssetsFound,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Liris 0x7B recovery plan is ready; USB writes and boot repairs are blocked until explicit approval.',
      agent: '(asolaria, liris, boot, inaccessible_boot_device, sovlinux, recovery, no_mutation)',
      device: 'node tools/liris-boot-usb-readiness-supervisor.js tick --execute'
    }
  };
  return `// cube: liris-boot-usb-readiness-supervisor | recovery | D47 BOUNDARY
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(plan, shannonPacket, generatedAt) {
  const assetRows = plan.hostEvidence.bootMediaAssets.assets.map((entry) =>
    `| ${entry.sizeMiB ?? ''} | ${entry.lastWriteTime ?? ''} | ${entry.path} |`
  ).join('\n');
  const repairRows = plan.winReRepairSequence.map((entry) =>
    `| ${entry.stage} | \`${entry.command}\` | ${entry.purpose} |`
  ).join('\n');
  const voteRows = shannonPacket.votes.map((entry) =>
    `| ${entry.part} | ${entry.vote} | ${entry.reason} |`
  ).join('\n');

  const md = `# Liris Boot USB Readiness

Generated: ${generatedAt}

Status: ${plan.status}

Stop code: \`${plan.incident.stopCode} (${plan.incident.bugcheck})\`

Meaning: Windows can reach the boot path but cannot access the Windows boot/system volume. This commonly comes from storage-mode mismatch, BCD/EFI damage, filesystem damage, missing storage driver, failed update, or disk failure. It is not proof that all Windows files are destroyed.

## USB State

- Disk observed: Disk ${plan.hostEvidence.usb.observedDiskNumber}, ${plan.hostEvidence.usb.friendlyName}, USB, MBR, Healthy.
- Partition: ${plan.hostEvidence.usb.partitionDriveLetter}:, ${plan.hostEvidence.usb.partitionSizeGiB} GiB, type ${plan.hostEvidence.usb.partitionType}.
- Windows mount state: ${plan.hostEvidence.usb.mountedInWindows ? 'mounted' : 'not mounted'}.
- Read-only CHKDSK finding: exFAT label \`${plan.hostEvidence.usb.chkdskReadOnlyFinding.label}\`, ${plan.hostEvidence.usb.chkdskReadOnlyFinding.result}.
- Decision: do not run \`chkdsk E: /f\`, format, or Ventoy install until operator approves mutating the USB.

## Boot Media Assets

- ISO assets found: ${plan.hostEvidence.bootMediaAssets.isoAssetsFound}
- Ventoy assets found: ${plan.hostEvidence.bootMediaAssets.ventoyAssetsFound}

| MiB | Last Write | Path |
| ---: | --- | --- |
${assetRows || '|  |  | none |'}

## Immediate Human Steps

${plan.immediateHumanSteps.map((entry) => `- ${entry}`).join('\n')}

## WinRE Repair Sequence

Only after booting into recovery media and identifying the correct Windows and EFI volumes.

| Stage | Command | Purpose |
| --- | --- | --- |
${repairRows}

## Hard Blocks

${plan.hardBlocks.map((entry) => `- ${entry}`).join('\n')}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}

| Part | Vote | Reason |
| --- | --- | --- |
${voteRows}
`;

  return { json: plan, md };
}

function tick({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const plan = buildPlan(generatedAt);
  const hermesPacket = buildHermes(plan, generatedAt);
  const shannonPacket = buildShannon(plan, generatedAt);
  const cube = buildCube(plan, shannonPacket, generatedAt);
  const report = buildReport(plan, shannonPacket, generatedAt);
  const eventId = `liris-boot-usb-readiness-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: plan.status,
      mode: MODE,
      report: repoRel(PATHS.reportMd),
      plan: repoRel(PATHS.plan)
    });
    writeJson(PATHS.plan, plan);
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'recovery',
      verb: 'EVT-LIRIS-BOOT-USB-READINESS',
      body: {
        status: plan.status,
        stopCode: plan.incident.stopCode,
        usbFinding: plan.hostEvidence.usb.chkdskReadOnlyFinding.result,
        report: repoRel(PATHS.reportMd)
      }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'recovery',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'liris_stop_0x7b',
      to: 'boot_recovery_no_usb_mutation',
      verb: 'recovery_plan_ready',
      weight: 0.9,
      digest: sha256Text(JSON.stringify(plan)).slice(0, 16)
    });
  }

  return {
    ok: true,
    action: execute ? 'tick' : 'preview',
    generatedAt,
    status: plan.status,
    stopCode: `${plan.incident.stopCode} (${plan.incident.bugcheck})`,
    usbMounted: plan.hostEvidence.usb.mountedInWindows,
    usbFinding: plan.hostEvidence.usb.chkdskReadOnlyFinding.result,
    isoAssetsFound: plan.hostEvidence.bootMediaAssets.isoAssetsFound,
    ventoyAssetsFound: plan.hostEvidence.bootMediaAssets.ventoyAssetsFound,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      state: repoRel(PATHS.state),
      plan: repoRel(PATHS.plan),
      hermes: repoRel(PATHS.hermes),
      shannon: repoRel(PATHS.shannon),
      cube: repoRel(PATHS.cube),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd)
    },
    nextOperatorChoice: [
      'preserve SOVLINUX and use another USB',
      'approve chkdsk E: /f against SOVLINUX',
      'approve overwriting SOVLINUX as boot media'
    ],
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(tick({ execute: false }), null, 2));
    return;
  }
  if (action === 'tick') {
    console.log(JSON.stringify(tick({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/liris-boot-usb-readiness-supervisor.js status',
      'node tools/liris-boot-usb-readiness-supervisor.js tick --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
