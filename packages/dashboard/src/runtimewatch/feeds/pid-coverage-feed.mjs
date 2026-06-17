import { buildSupervisorFeed } from '../../../../../tools/pid-registry-supervisor-feed.mjs';
import { PROCESS_CATALOG, PROCESS_CATALOG_VERSION, processRoomStubs, scoreCatalogEntry } from '../runtimewatch-process-catalog.mjs';
import { baseFeed, boundedRun, dataRootFromArg, feedPath, feedSidecarPath, hbpRow, readJson, writeJson, writeText } from '../runtimewatch-utils.mjs';

function normalize(value) {
  return String(value || '').toLowerCase();
}

function parsePort(localAddress) {
  const text = String(localAddress || '').trim();
  const idx = text.lastIndexOf(':');
  if (idx < 0) return null;
  const port = Number(text.slice(idx + 1));
  return Number.isFinite(port) ? port : null;
}

function parseNetstat(stdout) {
  const portsByPid = new Map();
  const lines = String(stdout || '').split(/\r?\n/g);
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5 || normalize(parts[0]) !== 'tcp') continue;
    if (normalize(parts[3]) !== 'listening') continue;
    const pid = Number(parts[4]);
    const port = parsePort(parts[1]);
    if (!Number.isFinite(pid) || !Number.isFinite(port)) continue;
    if (!portsByPid.has(pid)) portsByPid.set(pid, new Set());
    portsByPid.get(pid).add(port);
  }
  return portsByPid;
}

function rowIsInteresting(row) {
  const text = normalize(`${row.name || ''} ${row.command_redacted || ''} ${row.command_class || ''}`);
  return [
    'asolaria',
    'behcs',
    'dashboard',
    'omni',
    'gnn',
    'agent-keyboard',
    'codex',
    'claude',
    'hermes',
    'mcp',
    'fabric'
  ].some((needle) => text.includes(needle));
}

function ownerRegistryPresent(entry, registryRows) {
  const needles = [entry.target_supervisor, entry.target_prof].map(normalize);
  return registryRows.some((row) => {
    const text = normalize(`${row.name || ''} ${row.layer || ''} ${row.class || ''}`);
    return needles.some((needle) => needle && text.includes(needle));
  });
}

const dataRoot = dataRootFromArg();
const feed = baseFeed('pid-coverage', 'task-manager + netstat + supervisor-feed');
feed.catalog = {
  schema: PROCESS_CATALOG_VERSION,
  entries: PROCESS_CATALOG.length,
  room_stubs: processRoomStubs()
};

const task = readJson(feedPath('task-manager', dataRoot), null);
const registry = buildSupervisorFeed();
const netstat = boundedRun('netstat', ['-ano', '-p', 'tcp'], { timeout: 5000 });
const portsByPid = parseNetstat(netstat.stdout);

if (!task?.rows?.length) {
  feed.ok = false;
  feed.reason = 'task_manager_feed_missing_or_empty';
  feed.rows = [];
  feed.summary = { rows: 0 };
  feed.errors.push({ type: 'missing_task_manager_feed' });
} else {
  const rows = task.rows.map((row) => ({
    ...row,
    ports_tcp_listen: [...(portsByPid.get(row.pid) || new Set())].sort((a, b) => a - b)
  }));
  const registryRows = Array.isArray(registry.supervisors) ? registry.supervisors : [];
  const matchedPids = new Set();
  const catalogRows = PROCESS_CATALOG.map((entry) => {
    const match = rows
      .map((row) => ({ row, score: scoreCatalogEntry(entry, row) }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score || b.row.memory_mb - a.row.memory_mb)[0];
    if (match?.row?.pid) matchedPids.add(match.row.pid);
    const owner_present = ownerRegistryPresent(entry, registryRows);
    return {
      id: entry.id,
      kind: entry.kind,
      observed: Boolean(match),
      os_pid: match?.row?.pid ?? null,
      ppid: match?.row?.ppid ?? null,
      ports_tcp_listen: match?.row?.ports_tcp_listen ?? [],
      process_name: match?.row?.name ?? null,
      command_class: match?.row?.command_class ?? entry.runtime_kind,
      command_redacted: match?.row?.command_redacted ?? null,
      memory_mb: match?.row?.memory_mb ?? 0,
      target_runtime: entry.target_runtime,
      runtime_kind: entry.runtime_kind,
      cube: entry.cube,
      room_stub: entry.room_stub,
      target_supervisor: entry.target_supervisor,
      target_prof: entry.target_prof,
      owner_registry_present: owner_present,
      pid_binding_surface: 'missing',
      binding_state: match ? 'observed_without_fabric_os_pid_binding' : 'catalog_expected_not_running',
      swap_priority: entry.swap_priority,
      notes: entry.notes
    };
  });

  const unmatched = rows
    .filter((row) => !matchedPids.has(row.pid) && rowIsInteresting(row))
    .sort((a, b) => b.memory_mb - a.memory_mb)
    .slice(0, 64)
    .map((row) => ({
      pid: row.pid,
      name: row.name,
      command_class: row.command_class,
      memory_mb: row.memory_mb,
      command_redacted: row.command_redacted,
      ports_tcp_listen: row.ports_tcp_listen
    }));

  feed.rows = catalogRows;
  feed.unmatched_relevant = unmatched;
  feed.registry = {
    supervisor_entries: registry.counts?.supervisors ?? 0,
    prof_entries: registry.counts?.profs ?? 0,
    total_entries: registry.count ?? 0,
    pid_bearing_names: registry.counts?.pid_bearing_names ?? 0,
    source: registry.source || 'pid_registry_supervisor_feed'
  };
  feed.summary = {
    rows: catalogRows.length,
    observed_catalog_processes: catalogRows.filter((row) => row.observed).length,
    missing_catalog_processes: catalogRows.filter((row) => !row.observed).length,
    binding_gaps: catalogRows.filter((row) => row.binding_state === 'observed_without_fabric_os_pid_binding').length,
    owner_registry_present: catalogRows.filter((row) => row.owner_registry_present).length,
    unmatched_relevant: unmatched.length,
    host8_priority: catalogRows.filter((row) => row.target_runtime === 'host8-priority').length,
    host8_candidate: catalogRows.filter((row) => row.target_runtime === 'host8-candidate').length,
    netstat_ok: netstat.status === 0
  };
}

const output = feedPath('pid-coverage', dataRoot);
writeJson(output, feed);

const rows = [
  hbpRow('PIDCOVHDR', {
    ok: feed.ok ? 1 : 0,
    feed: 'pid-coverage',
    generated_at: feed.generated_at,
    catalog: feed.catalog.entries,
    rows: feed.summary?.rows || 0,
    json: 0
  }),
  hbpRow('PIDCOVSUMMARY', {
    observed_catalog_processes: feed.summary?.observed_catalog_processes || 0,
    missing_catalog_processes: feed.summary?.missing_catalog_processes || 0,
    binding_gaps: feed.summary?.binding_gaps || 0,
    unmatched_relevant: feed.summary?.unmatched_relevant || 0,
    host8_priority: feed.summary?.host8_priority || 0,
    host8_candidate: feed.summary?.host8_candidate || 0
  })
];
for (const row of feed.rows || []) {
  rows.push(hbpRow('PIDCOVROW', {
    id: row.id,
    observed: row.observed ? 1 : 0,
    os_pid: row.os_pid ?? '',
    ports: (row.ports_tcp_listen || []).join(','),
    command_class: row.command_class || '',
    target_runtime: row.target_runtime || '',
    cube: row.cube || '',
    room_stub: row.room_stub || '',
    binding_state: row.binding_state || '',
    swap_priority: row.swap_priority || 0
  }));
}
for (const row of feed.unmatched_relevant || []) {
  rows.push(hbpRow('PIDCOVDARK', {
    pid: row.pid,
    name: row.name,
    command_class: row.command_class,
    ports: (row.ports_tcp_listen || []).join(','),
    memory_mb: row.memory_mb
  }));
}
writeText(feedSidecarPath('pid-coverage', 'hbp', dataRoot), `${rows.join('\n')}\n`);

console.log(JSON.stringify({ ok: true, feed: 'pid-coverage', rows: feed.rows.length, available: feed.ok, path: output }, null, 2));
