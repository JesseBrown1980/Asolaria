#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_DRIVE = 'E:';
const MAX_DIRECTORIES = 10000;
const MAX_RECORDS = 200000;
const MAX_DIR_CLUSTERS = 4096;

const PATHS = Object.freeze({
  reportJson: rel('reports/usb-exfat-readonly-scan-latest.json'),
  reportMd: rel('reports/usb-exfat-readonly-scan-latest.md'),
  recordsNdjson: rel('data/recovery/usb-exfat-readonly-scan-latest.ndjson'),
  state: rel('data/behcs/state/recovery/usb-exfat-readonly-scan.state.json')
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

function toNdjson(rows) {
  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function parseArg(argv, name, fallback) {
  const prefix = `--${name}=`;
  const hit = argv.find((entry) => entry.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function rawPathForDrive(drive) {
  const normalized = drive.replace(/[\\/]+$/, '');
  return `\\\\.\\${normalized}`;
}

function readAt(fd, offset, length) {
  const buffer = Buffer.alloc(length);
  const bytesRead = fs.readSync(fd, buffer, 0, length, offset);
  return bytesRead === length ? buffer : buffer.subarray(0, bytesRead);
}

function parseBootSector(buffer) {
  const sectorShift = buffer.readUInt8(0x6c);
  const sectorsPerClusterShift = buffer.readUInt8(0x6d);
  const bytesPerSector = 1 << sectorShift;
  const sectorsPerCluster = 1 << sectorsPerClusterShift;
  const clusterSize = bytesPerSector * sectorsPerCluster;
  const volumeLengthSectors = Number(buffer.readBigUInt64LE(0x48));
  return {
    jump: buffer.subarray(0, 3).toString('hex'),
    fileSystemName: buffer.subarray(3, 11).toString('ascii').trim(),
    partitionOffsetSectors: Number(buffer.readBigUInt64LE(0x40)),
    volumeLengthSectors,
    fatOffsetSectors: buffer.readUInt32LE(0x50),
    fatLengthSectors: buffer.readUInt32LE(0x54),
    clusterHeapOffsetSectors: buffer.readUInt32LE(0x58),
    clusterCount: buffer.readUInt32LE(0x5c),
    rootDirectoryCluster: buffer.readUInt32LE(0x60),
    volumeSerialHex: buffer.readUInt32LE(0x64).toString(16).padStart(8, '0').toUpperCase(),
    fileSystemRevisionHex: buffer.readUInt16LE(0x68).toString(16).padStart(4, '0'),
    volumeFlagsHex: buffer.readUInt16LE(0x6a).toString(16).padStart(4, '0'),
    bytesPerSectorShift: sectorShift,
    sectorsPerClusterShift,
    bytesPerSector,
    sectorsPerCluster,
    clusterSize,
    numberOfFats: buffer.readUInt8(0x6e),
    driveSelect: buffer.readUInt8(0x6f),
    percentInUse: buffer.readUInt8(0x70),
    volumeBytes: volumeLengthSectors * bytesPerSector
  };
}

function clusterOffset(meta, cluster) {
  return (meta.clusterHeapOffsetSectors * meta.bytesPerSector) +
    ((cluster - 2) * meta.clusterSize);
}

function fatEntry(fd, meta, cluster) {
  const offset = (meta.fatOffsetSectors * meta.bytesPerSector) + (cluster * 4);
  const sectorOffset = Math.floor(offset / meta.bytesPerSector) * meta.bytesPerSector;
  const inSectorOffset = offset - sectorOffset;
  const buffer = readAt(fd, sectorOffset, meta.bytesPerSector);
  if (buffer.length < inSectorOffset + 4) return null;
  return buffer.readUInt32LE(inSectorOffset);
}

function clusterChain(fd, meta, startCluster, options = {}) {
  const maxClusters = options.maxClusters || MAX_DIR_CLUSTERS;
  const expectedBytes = options.expectedBytes || 0;
  const noFatChain = Boolean(options.noFatChain);
  if (!startCluster || startCluster < 2 || startCluster > meta.clusterCount + 1) return [];

  if (noFatChain && expectedBytes > 0) {
    const count = Math.max(1, Math.ceil(expectedBytes / meta.clusterSize));
    return Array.from({ length: Math.min(count, maxClusters) }, (_, i) => startCluster + i)
      .filter((cluster) => cluster <= meta.clusterCount + 1);
  }

  const chain = [];
  const seen = new Set();
  let current = startCluster;
  for (let i = 0; i < maxClusters; i += 1) {
    if (!current || current < 2 || current > meta.clusterCount + 1 || seen.has(current)) break;
    chain.push(current);
    seen.add(current);
    const next = fatEntry(fd, meta, current);
    if (next === null || next === 0 || next >= 0xfffffff8) break;
    current = next;
  }
  return chain;
}

function readClusters(fd, meta, clusters, expectedBytes = 0) {
  const buffers = [];
  let remaining = expectedBytes || Number.MAX_SAFE_INTEGER;
  for (const cluster of clusters) {
    const length = Math.min(meta.clusterSize, remaining);
    if (length <= 0) break;
    buffers.push(readAt(fd, clusterOffset(meta, cluster), length));
    remaining -= length;
  }
  return Buffer.concat(buffers);
}

function decodeUtf16Name(buffer, offset, bytes) {
  const chars = [];
  for (let i = 0; i < bytes; i += 2) {
    const code = buffer.readUInt16LE(offset + i);
    if (code === 0x0000 || code === 0xffff) break;
    chars.push(code);
  }
  return String.fromCharCode(...chars);
}

function parseDosTimestamp(value) {
  if (!value) return null;
  const date = (value >>> 16) & 0xffff;
  const time = value & 0xffff;
  const day = date & 0x1f;
  const month = (date >>> 5) & 0x0f;
  const year = ((date >>> 9) & 0x7f) + 1980;
  const second = (time & 0x1f) * 2;
  const minute = (time >>> 5) & 0x3f;
  const hour = (time >>> 11) & 0x1f;
  if (!day || !month) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

function attrNames(attr) {
  const names = [];
  if (attr & 0x0001) names.push('READONLY');
  if (attr & 0x0002) names.push('HIDDEN');
  if (attr & 0x0004) names.push('SYSTEM');
  if (attr & 0x0010) names.push('DIRECTORY');
  if (attr & 0x0020) names.push('ARCHIVE');
  return names;
}

function parseSystemEntry(entry, dirPath) {
  const type = entry.readUInt8(0);
  if (type === 0x83) {
    const length = entry.readUInt8(1);
    return {
      type: 'volume_label',
      path: dirPath,
      label: decodeUtf16Name(entry, 2, Math.min(length, 11) * 2)
    };
  }
  if (type === 0x81) {
    return {
      type: 'allocation_bitmap',
      path: dirPath,
      firstCluster: entry.readUInt32LE(0x14),
      dataLength: Number(entry.readBigUInt64LE(0x18))
    };
  }
  if (type === 0x82) {
    return {
      type: 'upcase_table',
      path: dirPath,
      checksumHex: entry.readUInt32LE(4).toString(16).padStart(8, '0'),
      firstCluster: entry.readUInt32LE(0x14),
      dataLength: Number(entry.readBigUInt64LE(0x18))
    };
  }
  return null;
}

function parseDirectoryBuffer(buffer, dirPath) {
  const records = [];
  const systemEntries = [];
  const deletedPrimaries = [];

  for (let offset = 0; offset + 32 <= buffer.length; offset += 32) {
    const entry = buffer.subarray(offset, offset + 32);
    const type = entry.readUInt8(0);
    if (type === 0x00) break;

    const system = parseSystemEntry(entry, dirPath);
    if (system) {
      systemEntries.push(system);
      continue;
    }

    const isActiveFilePrimary = type === 0x85;
    const isDeletedFilePrimary = type === 0x05;
    if (!isActiveFilePrimary && !isDeletedFilePrimary) continue;

    const secondaryCount = entry.readUInt8(1);
    const secondaries = [];
    for (let i = 0; i < secondaryCount && offset + ((i + 2) * 32) <= buffer.length; i += 1) {
      secondaries.push(buffer.subarray(offset + ((i + 1) * 32), offset + ((i + 2) * 32)));
    }
    offset += secondaryCount * 32;

    const stream = secondaries.find((secondary) => [0xc0, 0x40].includes(secondary.readUInt8(0)));
    if (!stream) {
      deletedPrimaries.push({ path: dirPath, offset, secondaryCount, reason: 'missing_stream_extension' });
      continue;
    }

    const nameEntries = secondaries.filter((secondary) => [0xc1, 0x41].includes(secondary.readUInt8(0)));
    const rawName = nameEntries.map((nameEntry) => decodeUtf16Name(nameEntry, 2, 30)).join('');
    const nameLength = stream.readUInt8(3);
    const name = rawName.slice(0, nameLength) || `[unnamed-${offset}]`;
    const attr = entry.readUInt16LE(4);
    const dataLength = Number(stream.readBigUInt64LE(24));
    const firstCluster = stream.readUInt32LE(20);
    const flags = stream.readUInt8(1);
    const noFatChain = Boolean(flags & 0x02);
    const isDirectory = Boolean(attr & 0x0010);
    const fullPath = dirPath === '/' ? `/${name}` : `${dirPath}/${name}`;

    records.push({
      type: isDeletedFilePrimary ? 'deleted_file_primary' : (isDirectory ? 'directory' : 'file'),
      active: isActiveFilePrimary,
      path: fullPath,
      name,
      parent: dirPath,
      attributes: attrNames(attr),
      attributeHex: attr.toString(16).padStart(4, '0'),
      firstCluster,
      dataLength,
      streamFlagsHex: flags.toString(16).padStart(2, '0'),
      noFatChain,
      createdAt: parseDosTimestamp(entry.readUInt32LE(8)),
      modifiedAt: parseDosTimestamp(entry.readUInt32LE(12)),
      accessedAt: parseDosTimestamp(entry.readUInt32LE(16)),
      secondaryCount
    });
  }

  return { records, systemEntries, deletedPrimaries };
}

function scanVolume(drive) {
  const generatedAt = new Date().toISOString();
  const rawPath = rawPathForDrive(drive);
  const fd = fs.openSync(rawPath, 'r');
  try {
    const bootSector = readAt(fd, 0, 512);
    const meta = parseBootSector(bootSector);
    if (meta.fileSystemName !== 'EXFAT') {
      throw new Error(`Expected EXFAT boot sector, found ${meta.fileSystemName || 'unknown'}`);
    }

    const queue = [{
      path: '/',
      firstCluster: meta.rootDirectoryCluster,
      dataLength: 0,
      noFatChain: false,
      isRoot: true
    }];
    const seenDirs = new Set();
    const allRecords = [];
    const systemEntries = [];
    const errors = [];
    let truncated = false;

    while (queue.length) {
      if (seenDirs.size >= MAX_DIRECTORIES || allRecords.length >= MAX_RECORDS) {
        truncated = true;
        break;
      }
      const dir = queue.shift();
      const dirKey = `${dir.firstCluster}:${dir.path}`;
      if (seenDirs.has(dirKey)) continue;
      seenDirs.add(dirKey);

      try {
        const chain = clusterChain(fd, meta, dir.firstCluster, {
          noFatChain: dir.noFatChain,
          expectedBytes: dir.dataLength || meta.clusterSize,
          maxClusters: MAX_DIR_CLUSTERS
        });
        const expectedBytes = dir.dataLength || (chain.length * meta.clusterSize);
        const dirBuffer = readClusters(fd, meta, chain, expectedBytes);
        const parsed = parseDirectoryBuffer(dirBuffer, dir.path);
        systemEntries.push(...parsed.systemEntries);
        for (const record of parsed.records) {
          allRecords.push(record);
          if (record.active &&
              record.type === 'directory' &&
              record.firstCluster >= 2 &&
              record.name !== '.' &&
              record.name !== '..') {
            queue.push({
              path: record.path,
              firstCluster: record.firstCluster,
              dataLength: record.dataLength,
              noFatChain: record.noFatChain,
              isRoot: false
            });
          }
        }
      } catch (error) {
        errors.push({ path: dir.path, firstCluster: dir.firstCluster, error: error.message });
      }
    }

    const activeRecords = allRecords.filter((record) => record.active);
    const hiddenRecords = activeRecords.filter((record) => record.attributes.includes('HIDDEN'));
    const systemRecords = activeRecords.filter((record) => record.attributes.includes('SYSTEM'));
    const recentRecords = activeRecords
      .filter((record) => String(record.modifiedAt || '').startsWith('2026-04-23') ||
        String(record.createdAt || '').startsWith('2026-04-23') ||
        String(record.accessedAt || '').startsWith('2026-04-23'))
      .sort((a, b) => String(b.modifiedAt || '').localeCompare(String(a.modifiedAt || '')));
    const largestFiles = activeRecords
      .filter((record) => record.type === 'file')
      .sort((a, b) => b.dataLength - a.dataLength)
      .slice(0, 50);

    return {
      scanId: 'usb-exfat-readonly-scan-latest',
      generatedAt,
      status: errors.length ? 'READONLY_SCAN_COMPLETE_WITH_DIRECTORY_ERRORS' : 'READONLY_SCAN_COMPLETE',
      drive,
      rawPath,
      mutation: {
        usbWrites: 0,
        chkdskFix: false,
        format: false,
        partitionWrites: false,
        fileCopiesFromUsb: 0
      },
      bootSector: meta,
      counts: {
        directoriesVisited: seenDirs.size,
        activeRecords: activeRecords.length,
        totalRecordsSeen: allRecords.length,
        systemMetadataEntries: systemEntries.length,
        hiddenRecords: hiddenRecords.length,
        systemRecords: systemRecords.length,
        recent20260423Records: recentRecords.length,
        largestFilesReported: largestFiles.length,
        errors: errors.length,
        truncated
      },
      volumeLabels: systemEntries.filter((entry) => entry.type === 'volume_label'),
      systemEntries,
      hiddenRecords,
      systemRecords,
      recent20260423Records: recentRecords.slice(0, 200),
      largestFiles,
      records: activeRecords,
      errors,
      digest: sha256Text(activeRecords.map((record) => `${record.path}|${record.dataLength}|${record.modifiedAt}`).join('\n'))
    };
  } finally {
    fs.closeSync(fd);
  }
}

function buildReport(scan) {
  const row = (record) => `| ${record.type} | ${record.dataLength} | ${record.modifiedAt || ''} | ${record.attributes.join(',') || ''} | ${record.path} |`;
  const hiddenRows = scan.hiddenRecords.slice(0, 40).map(row).join('\n');
  const systemRows = scan.systemRecords.slice(0, 40).map(row).join('\n');
  const recentRows = scan.recent20260423Records.slice(0, 80).map(row).join('\n');
  const largestRows = scan.largestFiles.slice(0, 40).map(row).join('\n');
  const errorRows = scan.errors.map((entry) => `| ${entry.path} | ${entry.firstCluster} | ${entry.error} |`).join('\n');

  return `# USB exFAT Read-Only Scan

Generated: ${scan.generatedAt}

Status: ${scan.status}

Drive: \`${scan.drive}\` via raw read path \`${scan.rawPath}\`

This scan read exFAT directory structures directly. It did not run \`chkdsk /f\`, format, edit partitions, write to the USB, or copy files from the USB.

## Boot Sector

- File system: ${scan.bootSector.fileSystemName}
- Volume serial: ${scan.bootSector.volumeSerialHex}
- Volume bytes: ${scan.bootSector.volumeBytes}
- Cluster size: ${scan.bootSector.clusterSize}
- Root directory cluster: ${scan.bootSector.rootDirectoryCluster}
- Percent in use from boot sector: ${scan.bootSector.percentInUse}

## Counts

- Directories visited: ${scan.counts.directoriesVisited}
- Active records: ${scan.counts.activeRecords}
- Hidden records: ${scan.counts.hiddenRecords}
- System records: ${scan.counts.systemRecords}
- Records touched on 2026-04-23: ${scan.counts.recent20260423Records}
- Directory errors: ${scan.counts.errors}
- Truncated: ${scan.counts.truncated}

## Volume Labels

${scan.volumeLabels.map((entry) => `- ${entry.label || '(empty)'}`).join('\n') || '- none found'}

## Recently Touched On 2026-04-23

| Type | Bytes | Modified | Attr | Path |
| --- | ---: | --- | --- | --- |
${recentRows || '| none | 0 |  |  |  |'}

## Hidden Records

| Type | Bytes | Modified | Attr | Path |
| --- | ---: | --- | --- | --- |
${hiddenRows || '| none | 0 |  |  |  |'}

## System Records

| Type | Bytes | Modified | Attr | Path |
| --- | ---: | --- | --- | --- |
${systemRows || '| none | 0 |  |  |  |'}

## Largest Files

| Type | Bytes | Modified | Attr | Path |
| --- | ---: | --- | --- | --- |
${largestRows || '| none | 0 |  |  |  |'}

## Directory Errors

| Path | First Cluster | Error |
| --- | ---: | --- |
${errorRows || '| none | 0 | none |'}
`;
}

function run(argv) {
  const drive = parseArg(argv, 'drive', DEFAULT_DRIVE);
  const execute = argv.includes('--execute');
  const scan = scanVolume(drive);
  const report = buildReport(scan);
  if (execute) {
    writeJson(PATHS.reportJson, scan);
    writeText(PATHS.reportMd, report);
    writeText(PATHS.recordsNdjson, toNdjson(scan.records));
    writeJson(PATHS.state, {
      savedAt: scan.generatedAt,
      status: scan.status,
      drive,
      report: repoRel(PATHS.reportMd),
      records: repoRel(PATHS.recordsNdjson),
      counts: scan.counts,
      digest: scan.digest
    });
  }
  return {
    ok: true,
    action: execute ? 'scan' : 'preview',
    status: scan.status,
    drive,
    counts: scan.counts,
    volumeLabels: scan.volumeLabels,
    outputs: {
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd),
      recordsNdjson: repoRel(PATHS.recordsNdjson),
      state: repoRel(PATHS.state)
    },
    mutation: scan.mutation
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  if (action === 'status' || action === 'scan') {
    console.log(JSON.stringify(run(argv), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/usb-exfat-readonly-scanner.js status --drive=E:',
      'node tools/usb-exfat-readonly-scanner.js scan --drive=E: --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
