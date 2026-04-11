/**
 * Seed NX infrastructure index entries into ASO.
 *
 * Creates 8 foundational NX entries (gateways, credentials, networks)
 * using the ASO runtime. Idempotent — checks crosswalk before creating.
 *
 * LX chain: LX-295, LX-204
 * Run: node tools/seed-nx-entries.js
 */

const aso = require("../src/index-kernel/aso");

const NX_ENTRIES = [
  {
    legacyId: "NX-001",
    name: "NX — MQTT Broker (ports 18883/18884/18885, TLS encrypted)",
    summary: "Asolaria MQTT broker on 192.168.15.189. Three listeners: TCP 18883, WS 18884, WSS 18885. All require TLS keys and certs/asolaria-local.pfx. Silence on plaintext is by design (LX-204).",
    tags: ["nx", "mqtt", "broker", "network", "tls", "encrypted", "foundational"],
    chain: ["LX-204", "LX-110", "LX-114", "LX-295"],
    surfaces: [
      { host: "192.168.15.189", port: "18883", state: "tls-required", keyRequired: true },
      { host: "192.168.15.189", port: "18884", state: "tls-required", keyRequired: true },
      { host: "192.168.15.189", port: "18885", state: "tls-required", keyRequired: true }
    ]
  },
  {
    legacyId: "NX-002",
    name: "NX — HTTPS Gateway (ports 4791/5443, TLS required)",
    summary: "Asolaria HTTPS gateway. Port 4791 is the checked-in runtime entry point. Port 5443 requires PFX cert. Both serve the colony API surface over encrypted HTTPS.",
    tags: ["nx", "https", "gateway", "tls", "api", "foundational"],
    chain: ["LX-204", "LX-295", "LX-018"],
    surfaces: [
      { host: "127.0.0.1", port: "4791", state: "https-preferred", keyRequired: true },
      { host: "127.0.0.1", port: "5443", state: "tls-required", keyRequired: true }
    ]
  },
  {
    legacyId: "NX-003",
    name: "NX — OpenClaw Gateway (port 18789, WebSocket)",
    summary: "OpenClaw WebSocket gateway on 127.0.0.1:18789. Provides WhatsApp bridge access, 53 skills, 8 sub-agent slots. Uses wss:// protocol.",
    tags: ["nx", "openclaw", "websocket", "gateway", "whatsapp", "foundational"],
    chain: ["LX-293", "LX-294", "LX-295"],
    surfaces: [
      { host: "127.0.0.1", port: "18789", state: "websocket", keyRequired: false }
    ]
  },
  {
    legacyId: "NX-004",
    name: "NX — Google OAuth Credential (Antigravity discovery)",
    summary: "Google OAuth credential set discovered via Antigravity language server. Tied to plasmatoid@gmail.com with auto-refresh tokens. Used for Google API integrations.",
    tags: ["nx", "credential", "google", "oauth", "antigravity", "foundational"],
    chain: ["LX-295"],
    surfaces: []
  },
  {
    legacyId: "NX-005",
    name: "NX — Gemini API Credential (Antigravity discovery)",
    summary: "Gemini API key discovered via Antigravity language server. Used for embeddings and AI model access. Key prefix AIzaSy...",
    tags: ["nx", "credential", "gemini", "api-key", "antigravity", "foundational"],
    chain: ["LX-295"],
    surfaces: []
  },
  {
    legacyId: "NX-006",
    name: "NX — WhatsApp Bridge (transport layer to Jesse's machine)",
    summary: "WhatsApp bridge via Baileys/OpenClaw connecting Asolaria colony (Rayssa, DESKTOP-PTSQTIE) to Gaia colony (Jesse). Primary cross-colony communication transport.",
    tags: ["nx", "whatsapp", "bridge", "transport", "cross-colony", "foundational"],
    chain: ["LX-293", "LX-294", "LX-295", "NX-003"],
    surfaces: []
  },
  {
    legacyId: "NX-007",
    name: "NX — Asolaria Colony Network (DESKTOP-PTSQTIE, Rayssa's machine)",
    summary: "Asolaria colony host machine. Hostname DESKTOP-PTSQTIE, operated by Rayssa. Runs MQTT broker, HTTPS gateway, OpenClaw, and local agent infrastructure.",
    tags: ["nx", "network", "colony", "asolaria", "host", "foundational"],
    chain: ["LX-295", "NX-001", "NX-002", "NX-003"],
    surfaces: [
      { host: "DESKTOP-PTSQTIE", port: "", state: "active", keyRequired: false },
      { host: "192.168.15.189", port: "", state: "active", keyRequired: false }
    ]
  },
  {
    legacyId: "NX-008",
    name: "NX — Gaia Colony Network (Jesse's machine, sovereign)",
    summary: "Gaia colony — Jesse Brown's sovereign machine. Hosts IX- prefix sovereign index. Reachable via WhatsApp bridge (NX-006) and MQTT (NX-001). Separate sovereignty boundary.",
    tags: ["nx", "network", "colony", "gaia", "sovereign", "foundational"],
    chain: ["LX-295", "NX-001", "NX-006"],
    surfaces: []
  }
];

function run() {
  console.log("=== Seeding NX infrastructure entries ===\n");

  let created = 0;
  let skipped = 0;

  for (const entry of NX_ENTRIES) {
    // Idempotency: check crosswalk for existing entry
    const existing = aso.findTopicByLegacyId(entry.legacyId);
    if (existing) {
      console.log(`SKIP  ${entry.legacyId} -> ${existing.asoId} (already exists: "${existing.name}")`);
      skipped++;
      continue;
    }

    // Create the topic
    const result = aso.addTopic({
      name: entry.name,
      type: "tool",
      tier: "foundational",
      legacyIds: [entry.legacyId],
      summary: entry.summary,
      tags: entry.tags,
      chain: entry.chain,
      status: "active",
      scope: "global",
      createdBy: "seed-nx-entries"
    });

    if (!result.ok) {
      console.log(`FAIL  ${entry.legacyId}: ${result.error}`);
      continue;
    }

    console.log(`CREATE ${entry.legacyId} -> ${result.id} ("${entry.name}")`);

    // Register surfaces (live port/host facts) for network entries
    for (const srf of entry.surfaces) {
      const srfResult = aso.addSurface({
        topicId: result.id,
        host: srf.host,
        port: srf.port,
        state: srf.state,
        keyRequired: srf.keyRequired,
        verifiedBy: "seed-nx-entries"
      });
      if (srfResult.ok) {
        const portLabel = srf.port ? `:${srf.port}` : "";
        console.log(`  SRF  ${srfResult.id} -> ${srf.host}${portLabel} [${srf.state}]`);
      } else {
        console.log(`  SRF FAIL: ${srfResult.error}`);
      }
    }

    created++;
  }

  console.log(`\n=== Done: ${created} created, ${skipped} skipped ===`);

  // Print final status
  const status = aso.getAsoStatus();
  console.log(`\nASO Status: ${status.counts.topics} topics, ${status.counts.surfaces} surfaces, ${status.counts.crosswalkMappings} crosswalk mappings`);
}

run();
