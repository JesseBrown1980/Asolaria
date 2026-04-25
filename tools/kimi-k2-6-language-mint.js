#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noKimiApiCall: true,
  noKimiCliRun: true,
  noSecretWrite: true,
  noDownloads: true,
  noInstall: true,
  noModelExecution: true,
  noAgentLaunch: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  supervisors: rel('data/behcs/supervisors/kimi/kimi-k2-6-supervisors.v1.json'),
  microParts: rel('data/behcs/codex/glyph-language/kimi-k2-6-behcs256-micro-parts.v1.json'),
  mapMapMapped: rel('data/behcs/maps/kimi/kimi-k2-6-map-map-mapped.v1.json'),
  cubeCubed: rel('data/behcs/cubes/kimi-k2-6-cube-cubed.cube.js'),
  index: rel('data/behcs/index/kimi-k2-6-language-index.v1.json'),
  memory: rel('data/memory/kimi-k2-6-language-memory.v1.json'),
  crypto: rel('data/behcs/crypto/kimi-k2-6-language-crypto-256.v1.json'),
  mintedLanguage: rel('data/behcs/codex/glyph-language/kimi-k2-6-minted-behcs256-language.v1.json'),
  supervisorLanguage: rel('data/behcs/supervisors/kimi/kimi-k2-6-supervisor-language-256.v1.json'),
  falconPacket: rel('data/behcs/codex/glyph-language/kimi-k2-6-falcon-liris-asolaria-packet.v1.json'),
  hermes: rel('data/behcs/hermes/kimi/kimi-k2-6-language-mint-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/kimi/kimi-k2-6-language-mint-consensus-latest.json'),
  state: rel('data/behcs/state/kimi/kimi-k2-6-language-mint.state.json'),
  cube: rel('data/behcs/cubes/kimi-k2-6-language-mint.cube.js'),
  reportJson: rel('reports/kimi-k2-6-language-mint-latest.json'),
  reportMd: rel('reports/kimi-k2-6-language-mint-latest.md'),
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

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, String(text || '').endsWith('\n') ? String(text || '') : `${text}\n`, 'utf8');
}

function appendNdjson(filePath, data) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text || '')).digest('hex');
}

function sha256Object(value) {
  return sha256Text(JSON.stringify(value));
}

function shortHash(value) {
  return sha256Text(value).slice(0, 16).toUpperCase();
}

function buildGlyphRecord(part, supervisor) {
  const seed = `${part.glyph}|${part.domain}|${part.aspect}|${part.gate}`;
  const digest = sha256Text(seed);
  return {
    glyph: part.glyph,
    byte: part.behcs256.byte,
    hex: part.behcs256.hex,
    domain: part.domain,
    slot: part.aspect,
    supervisor: part.supervisor,
    supervisorTitle: supervisor?.title || '',
    mapToken: `MAP.KIMI.${part.behcs256.hex.slice(2)}`,
    cubeToken: `CUBE.KIMI.${String(part.index).padStart(3, '0')}`,
    memoryToken: `MEM.KIMI.${shortHash(seed)}`,
    crypto256: {
      algorithm: 'sha256',
      seed,
      digest,
      first16: digest.slice(0, 16),
      last16: digest.slice(-16)
    },
    falconLineage: ['falcon', 'liris', 'asolaria'],
    language: {
      behcs: 'BEHCS-256',
      phrase: 'MAP MAP MAPPED / CUBE cube CUBED / index.memory.crypto.256',
      pronounce: `${part.domain}.${part.aspect}`.replace(/_/g, '-')
    },
    promotionGate: part.gate,
    runtimeDisposition: 'SUPERVISOR_LANGUAGE_ONLY_RUNTIME_BLOCKED'
  };
}

function buildRecords(microParts, supervisors) {
  const supervisorById = new Map((supervisors.supervisors || []).map((entry) => [entry.id, entry]));
  return microParts.microParts.map((part) => buildGlyphRecord(part, supervisorById.get(part.supervisor)));
}

function buildMapMapMapped(records, generatedAt) {
  const domains = {};
  for (const record of records) {
    if (!domains[record.domain]) {
      domains[record.domain] = {
        domain: record.domain,
        records: [],
        bytes: []
      };
    }
    domains[record.domain].records.push(record.glyph);
    domains[record.domain].bytes.push(record.byte);
  }
  return {
    mapId: 'kimi-k2-6-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY',
    doctrine: 'MAP MAP MAPPED',
    provider: 'kimi',
    model: 'kimi-k2.6',
    maps: {
      human: 'Kimi K2.6 connector supervision mapped into 16 domains and 256 BEHCS cells.',
      agent: '(kimi, supervisor, behcs256, map_map_mapped, falcon_liris_asolaria)',
      device: 'node tools/kimi-k2-6-language-mint.js mint --execute'
    },
    domains: Object.values(domains).map((entry) => ({
      ...entry,
      from: Math.min(...entry.bytes),
      to: Math.max(...entry.bytes),
      count: entry.records.length
    })),
    recordCount: records.length
  };
}

function buildCubeCubed(records, generatedAt) {
  const cube = {
    id: 'kimi-k2-6-cube-cubed',
    generatedAt,
    doctrine: 'CUBE cube CUBED',
    cubeCubed: true,
    primaryCatalog: { D: 256, name: 'BEHCS-256-KIMI', prime: 1613 },
    layers: [
      { id: 'map', artifact: repoRel(PATHS.mapMapMapped) },
      { id: 'index', artifact: repoRel(PATHS.index) },
      { id: 'memory', artifact: repoRel(PATHS.memory) },
      { id: 'crypto', artifact: repoRel(PATHS.crypto) },
      { id: 'language', artifact: repoRel(PATHS.mintedLanguage) },
      { id: 'supervisors', artifact: repoRel(PATHS.supervisorLanguage) }
    ],
    payload: {
      provider: 'kimi',
      model: 'kimi-k2.6',
      glyphCount: records.length,
      status: 'CUBE_CUBED_READY_RUNTIME_BLOCKED'
    },
    translate: {
      human: 'Kimi K2.6 is cube-cubed into map, index, memory, crypto, language, and supervisors.',
      agent: '(kimi, cube_cubed, behcs256, falcon, liris, asolaria)',
      device: 'node tools/kimi-k2-6-language-mint.js mint --execute'
    }
  };
  return `// cube: kimi-k2-6-cube-cubed | CUBE cube CUBED | BEHCS-256
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildIndex(records, generatedAt) {
  return {
    indexId: 'kimi-k2-6-language-index.v1',
    generatedAt,
    status: 'INDEX_READY',
    provider: 'kimi',
    model: 'kimi-k2.6',
    lookup: Object.fromEntries(records.map((record) => [record.glyph, {
      byte: record.byte,
      hex: record.hex,
      domain: record.domain,
      slot: record.slot,
      supervisor: record.supervisor,
      mapToken: record.mapToken,
      cubeToken: record.cubeToken,
      memoryToken: record.memoryToken,
      digest: record.crypto256.digest
    }])),
    byDomain: records.reduce((acc, record) => {
      acc[record.domain] = acc[record.domain] || [];
      acc[record.domain].push(record.glyph);
      return acc;
    }, {})
  };
}

function buildMemory(records, generatedAt) {
  return {
    memoryId: 'kimi-k2-6-language-memory.v1',
    generatedAt,
    status: 'MEMORY_READY',
    law: 'append_only_summary_memory_no_secret_material',
    summary: {
      provider: 'kimi',
      model: 'kimi-k2.6',
      records: records.length,
      meaning: 'Kimi connector is represented as 256 supervised glyphs; runtime remains gated until auth/cost/endpoint/operator cutover are satisfied.'
    },
    anchors: records.map((record) => ({
      memoryToken: record.memoryToken,
      glyph: record.glyph,
      sentence: `${record.glyph} supervises ${record.domain}/${record.slot} for Kimi K2.6. Gate: ${record.promotionGate}.`
    }))
  };
}

function buildCrypto(records, generatedAt) {
  const leaves = records.map((record) => ({
    glyph: record.glyph,
    byte: record.byte,
    digest: record.crypto256.digest
  }));
  const merkleRoot = sha256Text(leaves.map((leaf) => leaf.digest).join(''));
  return {
    cryptoId: 'kimi-k2-6-language-crypto-256.v1',
    generatedAt,
    status: 'CRYPTO_256_READY',
    algorithm: 'sha256',
    glyphCount: records.length,
    merkleStyle: 'ordered_digest_chain',
    merkleRoot,
    leaves
  };
}

function buildMintedLanguage(records, generatedAt) {
  return {
    languageId: 'kimi-k2-6-minted-behcs256-language.v1',
    generatedAt,
    status: 'MINTED_INTO_LANGUAGE',
    phrase: 'MAP MAP MAPPED / CUBE cube CUBED / index.memory.crypto.256',
    origin: ['Falcon', 'Liris', 'Asolaria'],
    provider: 'kimi',
    model: 'kimi-k2.6',
    grammar: {
      glyphPattern: 'BH.KIMI.000..BH.KIMI.255',
      mapPattern: 'MAP.KIMI.00..FF',
      cubePattern: 'CUBE.KIMI.000..255',
      memoryPattern: 'MEM.KIMI.<sha256-16>',
      byteRange: '0x00..0xFF'
    },
    records
  };
}

function buildSupervisorLanguage(records, supervisors, generatedAt) {
  const bySupervisor = {};
  for (const record of records) {
    bySupervisor[record.supervisor] = bySupervisor[record.supervisor] || [];
    bySupervisor[record.supervisor].push(record.glyph);
  }
  return {
    supervisorLanguageId: 'kimi-k2-6-supervisor-language-256.v1',
    generatedAt,
    status: 'SUPERVISORS_MINTED_WITH_LANGUAGE_256',
    provider: 'kimi',
    model: 'kimi-k2.6',
    supervisors: (supervisors.supervisors || []).map((entry) => ({
      id: entry.id,
      domain: entry.domain,
      gate: entry.gate,
      glyphs: bySupervisor[entry.id] || [],
      languageCommand: `SUPERVISE ${entry.domain} USING ${entry.id} OVER ${entry.ownsMicroRange.from}..${entry.ownsMicroRange.to}`
    }))
  };
}

function buildFalconPacket(records, generatedAt) {
  return {
    packetId: 'kimi-k2-6-falcon-liris-asolaria-packet.v1',
    generatedAt,
    status: 'FALCON_LIRIS_ASOLARIA_LANGUAGE_BINDING_READY',
    origin: {
      falcon: 'BEHCS-256 glyph packet surface',
      liris: 'language/memory recovery and federation lineage',
      asolaria: 'local supervisor/control plane'
    },
    provider: 'kimi',
    model: 'kimi-k2.6',
    records: records.map((record) => ({
      glyph: record.glyph,
      falconLineage: record.falconLineage,
      mapToken: record.mapToken,
      cubeToken: record.cubeToken,
      memoryToken: record.memoryToken,
      digest16: record.crypto256.first16
    }))
  };
}

function buildShannon(records, cryptoPacket, generatedAt) {
  return {
    integrationId: 'kimi-k2-6-language-mint-shannon-consensus',
    generatedAt,
    status: 'consensus_language_minted_runtime_blocked',
    consensus: 'PROCEED-LANGUAGE-MINT-ONLY',
    executionDisposition: 'no_api_no_cli_no_secret_no_download_no_runtime_switch',
    votes: [
      { part: 'map', vote: 'PROCEED', reason: 'MAP MAP MAPPED artifact emitted.' },
      { part: 'cube', vote: 'PROCEED', reason: 'CUBE cube CUBED artifact emitted.' },
      { part: 'index', vote: 'PROCEED', reason: 'Glyph lookup index emitted.' },
      { part: 'memory', vote: 'PROCEED', reason: 'Append-only summary memory emitted without secrets.' },
      { part: 'crypto', vote: 'PROCEED', reason: `Ordered SHA-256 digest chain root ${cryptoPacket.merkleRoot.slice(0, 16)}...` },
      { part: 'runtime', vote: 'HALT', reason: 'Kimi runtime remains unconfigured and blocked.' },
      { part: 'language', vote: 'PROCEED', reason: `${records.length} BEHCS-256 glyphs minted.` }
    ]
  };
}

function buildHermes(records, shannon, generatedAt) {
  return {
    integrationId: 'kimi-k2-6-language-mint-hermes-dispatch',
    generatedAt,
    status: 'KIMI_LANGUAGE_MINT_READY',
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-KIMI-K2-6-LANGUAGE-MINT',
      summary: 'Kimi K2.6 supervisor micro-parts minted into MAP MAP MAPPED, CUBE cube CUBED, index, memory, crypto, and BEHCS-256 language artifacts.',
      provider: 'kimi',
      model: 'kimi-k2.6',
      glyphCount: records.length,
      consensus: shannon.consensus,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildCube(records, shannon, generatedAt) {
  const cube = {
    id: 'kimi-k2-6-language-mint',
    generatedAt,
    primaryCatalog: { D: 256, name: 'BEHCS-256-KIMI-MINT', prime: 1613 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47, 256],
    doctrine: ['MAP MAP MAPPED', 'CUBE cube CUBED', 'index', 'memory', 'crypto-256', 'BEHCS-256'],
    payload: {
      kind: 'kimi-language-mint',
      status: 'KIMI_LANGUAGE_MINT_READY',
      provider: 'kimi',
      model: 'kimi-k2.6',
      glyphCount: records.length,
      shannon: {
        consensus: shannon.consensus,
        executionDisposition: shannon.executionDisposition
      }
    },
    translate: {
      human: 'Kimi K2.6 supervisors are minted into the Falcon/Liris/Asolaria BEHCS-256 language.',
      agent: '(kimi, minted, behcs256, map_map_mapped, cube_cubed, index, memory, crypto)',
      device: 'node tools/kimi-k2-6-language-mint.js mint --execute'
    }
  };
  return `// cube: kimi-k2-6-language-mint | BEHCS-256 | MAP MAP MAPPED
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function outputMap() {
  return {
    mapMapMapped: repoRel(PATHS.mapMapMapped),
    cubeCubed: repoRel(PATHS.cubeCubed),
    index: repoRel(PATHS.index),
    memory: repoRel(PATHS.memory),
    crypto: repoRel(PATHS.crypto),
    mintedLanguage: repoRel(PATHS.mintedLanguage),
    supervisorLanguage: repoRel(PATHS.supervisorLanguage),
    falconPacket: repoRel(PATHS.falconPacket),
    hermes: repoRel(PATHS.hermes),
    shannon: repoRel(PATHS.shannon),
    state: repoRel(PATHS.state),
    cube: repoRel(PATHS.cube),
    reportJson: repoRel(PATHS.reportJson),
    reportMd: repoRel(PATHS.reportMd)
  };
}

function buildReport(payload) {
  const { generatedAt, records, cryptoPacket, shannon } = payload;
  const sampleRows = records.slice(0, 16).map((record) =>
    `| ${record.byte} | ${record.glyph} | ${record.mapToken} | ${record.cubeToken} | ${record.memoryToken} | ${record.crypto256.first16} |`
  ).join('\n');
  const json = {
    reportId: 'kimi-k2-6-language-mint-latest',
    generatedAt,
    status: 'KIMI_LANGUAGE_MINT_READY',
    mode: MODE,
    glyphCount: records.length,
    cryptoRoot: cryptoPacket.merkleRoot,
    shannon,
    outputs: outputMap()
  };
  const md = `# Kimi K2.6 Language Mint

Generated: ${generatedAt}

Status: KIMI_LANGUAGE_MINT_READY

Minted the Kimi K2.6 supervisor breakdown into MAP MAP MAPPED, CUBE cube CUBED, index, memory, crypto-256, and Falcon/Liris/Asolaria BEHCS-256 glyph language artifacts.

No Kimi API call, Kimi CLI run, secret write, download, install, model execution, agent launch, or runtime switch was performed.

## Outputs

- MAP MAP MAPPED: \`${repoRel(PATHS.mapMapMapped)}\`
- CUBE cube CUBED: \`${repoRel(PATHS.cubeCubed)}\`
- Index: \`${repoRel(PATHS.index)}\`
- Memory: \`${repoRel(PATHS.memory)}\`
- Crypto-256: \`${repoRel(PATHS.crypto)}\`
- Minted language: \`${repoRel(PATHS.mintedLanguage)}\`
- Supervisor language: \`${repoRel(PATHS.supervisorLanguage)}\`
- Falcon/Liris/Asolaria packet: \`${repoRel(PATHS.falconPacket)}\`

## Crypto

- Algorithm: SHA-256
- Glyph count: ${records.length}
- Ordered digest-chain root: \`${cryptoPacket.merkleRoot}\`

## Shannon

- Consensus: ${shannon.consensus}
- Execution: ${shannon.executionDisposition}

## First 16 Glyphs

| Byte | Glyph | Map | Cube | Memory | Digest16 |
| ---: | --- | --- | --- | --- | --- |
${sampleRows}
`;
  return { json, md };
}

function mint({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const microParts = readJson(PATHS.microParts, null);
  const supervisors = readJson(PATHS.supervisors, null);
  if (!microParts || !Array.isArray(microParts.microParts) || microParts.microParts.length !== 256) {
    throw new Error('Expected 256 Kimi BEHCS micro-parts. Run kimi-k2-6-supervisor-breakdown first.');
  }
  if (!supervisors || !Array.isArray(supervisors.supervisors)) {
    throw new Error('Expected Kimi supervisor set. Run kimi-k2-6-supervisor-breakdown first.');
  }

  const records = buildRecords(microParts, supervisors);
  const mapPacket = buildMapMapMapped(records, generatedAt);
  const indexPacket = buildIndex(records, generatedAt);
  const memoryPacket = buildMemory(records, generatedAt);
  const cryptoPacket = buildCrypto(records, generatedAt);
  const mintedLanguage = buildMintedLanguage(records, generatedAt);
  const supervisorLanguage = buildSupervisorLanguage(records, supervisors, generatedAt);
  const falconPacket = buildFalconPacket(records, generatedAt);
  const shannon = buildShannon(records, cryptoPacket, generatedAt);
  const hermes = buildHermes(records, shannon, generatedAt);
  const cube = buildCube(records, shannon, generatedAt);
  const cubeCubed = buildCubeCubed(records, generatedAt);
  const report = buildReport({ generatedAt, records, cryptoPacket, shannon });
  const eventId = `kimi-k2-6-language-mint-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.mapMapMapped, mapPacket);
    writeText(PATHS.cubeCubed, cubeCubed);
    writeJson(PATHS.index, indexPacket);
    writeJson(PATHS.memory, memoryPacket);
    writeJson(PATHS.crypto, cryptoPacket);
    writeJson(PATHS.mintedLanguage, mintedLanguage);
    writeJson(PATHS.supervisorLanguage, supervisorLanguage);
    writeJson(PATHS.falconPacket, falconPacket);
    writeJson(PATHS.shannon, shannon);
    writeJson(PATHS.hermes, hermes);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: 'KIMI_LANGUAGE_MINT_READY',
      mode: MODE,
      glyphCount: records.length,
      cryptoRoot: cryptoPacket.merkleRoot,
      outputs: outputMap()
    });
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'kimi-language-mint',
      verb: 'EVT-KIMI-K2-6-LANGUAGE-MINT',
      body: {
        status: 'KIMI_LANGUAGE_MINT_READY',
        glyphCount: records.length,
        cryptoRoot: cryptoPacket.merkleRoot,
        report: repoRel(PATHS.reportMd)
      }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'kimi-language-mint',
      verb: hermes.packet.verb,
      body: hermes
    });
    for (const record of records) {
      appendNdjson(PATHS.gnnEdges, {
        id: `${eventId}-${record.glyph}`,
        ts: generatedAt,
        from: record.glyph,
        to: record.supervisor,
        verb: 'minted_supervisor_language_edge',
        weight: 0.256
      });
    }
  }

  return {
    ok: true,
    action: execute ? 'mint' : 'preview',
    generatedAt,
    status: 'KIMI_LANGUAGE_MINT_READY',
    glyphCount: records.length,
    cryptoRoot: cryptoPacket.merkleRoot,
    shannon: {
      status: shannon.status,
      consensus: shannon.consensus
    },
    outputs: outputMap(),
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  try {
    if (action === 'status') {
      console.log(JSON.stringify(mint({ execute: false }), null, 2));
      return;
    }
    if (action === 'mint') {
      console.log(JSON.stringify(mint({ execute }), null, 2));
      return;
    }
    console.error(JSON.stringify({
      ok: false,
      error: `Unknown action: ${action}`,
      usage: [
        'node tools/kimi-k2-6-language-mint.js status',
        'node tools/kimi-k2-6-language-mint.js mint --execute'
      ]
    }, null, 2));
    process.exitCode = 2;
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      error: error.message
    }, null, 2));
    process.exitCode = 1;
  }
}

main(process.argv);
