#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const recordsPath = path.join(repoRoot, 'data/recovery/usb-exfat-readonly-scan-latest.ndjson');

function parseArg(argv, name, fallback) {
  const prefix = `--${name}=`;
  const hit = argv.find((entry) => entry.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function rawPathForDrive(drive) {
  return `\\\\.\\${drive.replace(/[\\/]+$/, '')}`;
}

function readAt(fd, offset, length, sectorSize = 512) {
  const alignedOffset = Math.floor(offset / sectorSize) * sectorSize;
  const delta = offset - alignedOffset;
  const alignedLength = Math.ceil((delta + length) / sectorSize) * sectorSize;
  const buffer = Buffer.alloc(alignedLength);
  const bytesRead = fs.readSync(fd, buffer, 0, alignedLength, alignedOffset);
  const available = Math.max(0, bytesRead - delta);
  return buffer.subarray(delta, delta + Math.min(length, available));
}

function parseBootSector(buffer) {
  const bytesPerSector = 1 << buffer.readUInt8(0x6c);
  const sectorsPerCluster = 1 << buffer.readUInt8(0x6d);
  return {
    bytesPerSector,
    sectorsPerCluster,
    clusterSize: bytesPerSector * sectorsPerCluster,
    fatOffsetSectors: buffer.readUInt32LE(0x50),
    clusterHeapOffsetSectors: buffer.readUInt32LE(0x58),
    clusterCount: buffer.readUInt32LE(0x5c)
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
  const buffer = readAt(fd, sectorOffset, meta.bytesPerSector, meta.bytesPerSector);
  if (buffer.length < inSectorOffset + 4) return null;
  return buffer.readUInt32LE(inSectorOffset);
}

function clusterChain(fd, meta, record) {
  if (!record.firstCluster || record.firstCluster < 2) return [];
  if (record.noFatChain) {
    const count = Math.max(1, Math.ceil(record.dataLength / meta.clusterSize));
    return Array.from({ length: count }, (_, i) => record.firstCluster + i);
  }
  const chain = [];
  const seen = new Set();
  let current = record.firstCluster;
  while (current >= 2 && current <= meta.clusterCount + 1 && !seen.has(current) && chain.length < 4096) {
    chain.push(current);
    seen.add(current);
    const next = fatEntry(fd, meta, current);
    if (next === null || next === 0 || next >= 0xfffffff8) break;
    current = next;
  }
  return chain;
}

function readRecord(fd, meta, record) {
  const chunks = [];
  let remaining = record.dataLength;
  for (const cluster of clusterChain(fd, meta, record)) {
    if (remaining <= 0) break;
    const length = Math.min(meta.clusterSize, remaining);
    chunks.push(readAt(fd, clusterOffset(meta, cluster), length, meta.bytesPerSector));
    remaining -= length;
  }
  return Buffer.concat(chunks).subarray(0, record.dataLength);
}

function loadRecords() {
  return fs.readFileSync(recordsPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function main(argv) {
  const drive = parseArg(argv, 'drive', 'E:');
  const requested = argv.filter((entry) => entry.startsWith('/'));
  if (!requested.length) {
    console.error(JSON.stringify({
      ok: false,
      error: 'Provide one or more USB paths, e.g. /sovereignty/index/BOOT-CRITICAL.md'
    }, null, 2));
    process.exitCode = 2;
    return;
  }

  const records = loadRecords();
  const fd = fs.openSync(rawPathForDrive(drive), 'r');
  try {
    const boot = readAt(fd, 0, 512, 512);
    const meta = parseBootSector(boot);
    const previews = [];
    for (const p of requested) {
      const record = records.find((entry) => entry.path.toLowerCase() === p.toLowerCase());
      if (!record) {
        previews.push({ path: p, ok: false, error: 'not_found_in_scan' });
        continue;
      }
      if (record.type !== 'file') {
        previews.push({ path: p, ok: false, error: `not_a_file:${record.type}` });
        continue;
      }
      const buffer = readRecord(fd, meta, record);
      const text = buffer.toString('utf8').replace(/\u0000/g, '');
      previews.push({
        path: record.path,
        ok: true,
        bytes: buffer.length,
        sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
        modifiedAt: record.modifiedAt,
        preview: text.slice(0, 12000)
      });
    }
    console.log(JSON.stringify({ ok: true, drive, previews }, null, 2));
  } finally {
    fs.closeSync(fd);
  }
}

main(process.argv.slice(2));
