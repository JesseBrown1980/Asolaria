export const PROCESS_CATALOG_VERSION = 'asolaria.runtimewatch.process-catalog.v1';

export const PROCESS_CATALOG = [
  {
    id: 'behcs-bus',
    kind: 'spine',
    runtime_kind: 'node',
    target_runtime: 'host8-priority',
    expected_ports: [4947],
    match_any: ['behcs-bus.js', 'BEHCS Omnidirectional Message Bus'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-FABRIC-SPINE',
    target_prof: 'PROF-BEHCS-BUS',
    room_stub: 'rooms/task-manager/spine/behcs-bus',
    swap_priority: 1,
    notes: 'LAW-001 bus spine'
  },
  {
    id: 'super-dashboard',
    kind: 'dashboard',
    runtime_kind: 'node',
    target_runtime: 'host8-priority',
    expected_ports: [4949, 4944],
    match_any: ['super-dashboard-server.mjs', 'super-dashboard'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-SUPER-DASHBOARD',
    target_prof: 'PROF-SUPER-DASHBOARD',
    room_stub: 'rooms/task-manager/surface/super-dashboard',
    swap_priority: 2,
    notes: 'Acer + liris dashboard surfaces'
  },
  {
    id: 'omnidispatcher',
    kind: 'dispatch',
    runtime_kind: 'node',
    target_runtime: 'host8-priority',
    expected_ports: [4950],
    match_any: ['omnidispatcher.mjs', 'omnidispatcher'],
    cube: 'supervisor-pid-indicator',
    target_supervisor: 'SUP-OMNIDISPATCH',
    target_prof: 'PROF-OMNIDISPATCH',
    room_stub: 'rooms/task-manager/dispatch/omnidispatcher',
    swap_priority: 3,
    notes: 'dispatch fanout + route scheduler'
  },
  {
    id: 'vote-quorum',
    kind: 'quorum',
    runtime_kind: 'python',
    target_runtime: 'host8-candidate',
    expected_ports: [4952],
    match_any: ['vote-quorum-daemon.py', 'vote-quorum'],
    cube: 'supervisor-pid-indicator',
    target_supervisor: 'SUP-VOTE-QUORUM',
    target_prof: 'PROF-VOTE-QUORUM',
    room_stub: 'rooms/task-manager/quorum/vote-quorum',
    swap_priority: 4,
    notes: 'quorum tally daemon'
  },
  {
    id: 'cosign-chain',
    kind: 'cosign',
    runtime_kind: 'python',
    target_runtime: 'host8-candidate',
    expected_ports: [4953],
    match_any: ['cosign-chain-daemon.py', 'cosign-chain'],
    cube: 'supervisor-pid-indicator',
    target_supervisor: 'SUP-COSIGN-CHAIN',
    target_prof: 'PROF-COSIGN-CHAIN',
    room_stub: 'rooms/task-manager/cosign/cosign-chain',
    swap_priority: 5,
    notes: 'single-writer cosign daemon'
  },
  {
    id: 'federation-pulse',
    kind: 'pulse',
    runtime_kind: 'python',
    target_runtime: 'host8-candidate',
    expected_ports: [],
    match_any: ['federation-pulse-daemon', 'federation-pulse'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-FEDERATION-PULSE',
    target_prof: 'PROF-FEDERATION-PULSE',
    room_stub: 'rooms/task-manager/pulse/federation-pulse',
    swap_priority: 6,
    notes: 'pulse daemon'
  },
  {
    id: 'self-reflect',
    kind: 'reflect',
    runtime_kind: 'python',
    target_runtime: 'host8-candidate',
    expected_ports: [],
    match_any: ['self-reflect-daemon', 'self-reflect'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-SELF-REFLECT',
    target_prof: 'PROF-SELF-REFLECT',
    room_stub: 'rooms/task-manager/reflect/self-reflect',
    swap_priority: 7,
    notes: 'self-reflect supervisor loop'
  },
  {
    id: 'gnn-l0',
    kind: 'gnn',
    runtime_kind: 'python',
    target_runtime: 'host8-after-parity',
    expected_ports: [4792],
    match_any: ['gnn-sidecar', 'inference_server.py', '4792'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-GNN-L0',
    target_prof: 'PROF-GNN-L0',
    room_stub: 'rooms/task-manager/gnn/gnn-l0',
    swap_priority: 8,
    notes: 'inference lane'
  },
  {
    id: 'gnn-l4',
    kind: 'gnn',
    runtime_kind: 'python',
    target_runtime: 'host8-after-parity',
    expected_ports: [4793],
    match_any: ['gslgnn-sidecar', 'gslgnn', '4793'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-GNN-L4',
    target_prof: 'PROF-GNN-L4',
    room_stub: 'rooms/task-manager/gnn/gnn-l4',
    swap_priority: 9,
    notes: 'advanced gnn lane'
  },
  {
    id: 'agent-keyboard',
    kind: 'surface',
    runtime_kind: 'node',
    target_runtime: 'host8-priority',
    expected_ports: [4820, 4913],
    match_any: ['agent-keyboard.js', 'agent-keyboard'],
    cube: 'device-pid-indicator',
    target_supervisor: 'SUP-AGENT-KEYBOARD',
    target_prof: 'PROF-AGENT-KEYBOARD',
    room_stub: 'rooms/task-manager/surface/agent-keyboard',
    swap_priority: 10,
    notes: 'UI keyboard/control lane'
  },
  {
    id: 'auto-fabric-query-daemon',
    kind: 'watcher',
    runtime_kind: 'node',
    target_runtime: 'retire-or-host8',
    expected_ports: [],
    match_any: ['auto-fabric-query-daemon.mjs', 'auto-fabric-query-daemon'],
    cube: 'supervisor-pid-indicator',
    target_supervisor: 'SUP-FABRIC-QUERY',
    target_prof: 'PROF-FABRIC-QUERY',
    room_stub: 'rooms/task-manager/watch/auto-fabric-query',
    swap_priority: 20,
    notes: 'watcher candidate for merge/retire'
  },
  {
    id: 'gnn-dispatch-bridge',
    kind: 'bridge',
    runtime_kind: 'node',
    target_runtime: 'retire-or-host8',
    expected_ports: [],
    match_any: ['gnn-dispatch-bridge.mjs', 'gnn-dispatch-bridge'],
    cube: 'supervisor-pid-indicator',
    target_supervisor: 'SUP-GNN-DISPATCH-BRIDGE',
    target_prof: 'PROF-GNN-DISPATCH-BRIDGE',
    room_stub: 'rooms/task-manager/bridge/gnn-dispatch-bridge',
    swap_priority: 21,
    notes: 'bridge candidate for merge/retire'
  },
  {
    id: 'mcp-asolaria-fabric',
    kind: 'mcp-bridge',
    runtime_kind: 'node',
    target_runtime: 'bridge-later',
    expected_ports: [],
    match_any: ['mcp-servers/asolaria-fabric/server.js', 'asolaria-fabric/server.js'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-MCP-ASOLARIA-FABRIC',
    target_prof: 'PROF-MCP-ASOLARIA-FABRIC',
    room_stub: 'rooms/task-manager/mcp/asolaria-fabric',
    swap_priority: 30,
    notes: 'stdio bridge to local fabric tools'
  },
  {
    id: 'mcp-asolaria-web',
    kind: 'mcp-bridge',
    runtime_kind: 'node',
    target_runtime: 'bridge-later',
    expected_ports: [],
    match_any: ['mcp-servers/asolaria-web/server.js', 'asolaria-web/server.js'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-MCP-ASOLARIA-WEB',
    target_prof: 'PROF-MCP-ASOLARIA-WEB',
    room_stub: 'rooms/task-manager/mcp/asolaria-web',
    swap_priority: 31,
    notes: 'stdio bridge to web tools'
  },
  {
    id: 'mcp-google-wiki',
    kind: 'mcp-bridge',
    runtime_kind: 'node',
    target_runtime: 'bridge-later',
    expected_ports: [],
    match_any: ['mcp-servers/google-wiki/server.js', 'google-wiki/server.js'],
    cube: 'system-surface-pid-indicator',
    target_supervisor: 'SUP-MCP-GOOGLE-WIKI',
    target_prof: 'PROF-MCP-GOOGLE-WIKI',
    room_stub: 'rooms/task-manager/mcp/google-wiki',
    swap_priority: 32,
    notes: 'stdio bridge to google/wiki tools'
  }
];

function normalize(value) {
  return String(value || '').toLowerCase();
}

export function scoreCatalogEntry(entry, row) {
  const text = normalize(`${row.name || ''} ${row.command_redacted || ''}`);
  const ports = Array.isArray(row.ports_tcp_listen) ? row.ports_tcp_listen : [];
  let score = 0;
  let evidence = 0;
  for (const needle of entry.match_any || []) {
    if (text.includes(normalize(needle))) {
      evidence += 1;
      score += 5;
    }
  }
  if ((entry.expected_ports || []).some((port) => ports.includes(port))) {
    evidence += 1;
    score += 7;
  }
  if (evidence === 0) return 0;
  if (entry.runtime_kind && normalize(row.command_class) === normalize(entry.runtime_kind)) score += 2;
  return score;
}

export function processRoomStubs() {
  return PROCESS_CATALOG
    .slice()
    .sort((a, b) => a.swap_priority - b.swap_priority)
    .map((entry) => ({
      room_stub: entry.room_stub,
      id: entry.id,
      cube: entry.cube,
      target_supervisor: entry.target_supervisor,
      target_prof: entry.target_prof,
      target_runtime: entry.target_runtime,
      swap_priority: entry.swap_priority
    }));
}
