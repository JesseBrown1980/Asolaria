import { processRoomStubs } from '../runtimewatch-process-catalog.mjs';
import { baseFeed, dataRootFromArg, feedPath, feedSidecarPath, hbpRow, readJson, writeJson, writeText } from '../runtimewatch-utils.mjs';

function summarizeBy(rows, key) {
  return (rows || []).reduce((acc, row) => {
    const bucket = row?.[key] || 'unknown';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});
}

const dataRoot = dataRootFromArg();
const feed = baseFeed('asolaria-task-manager', 'runtimewatch synthesis');
const task = readJson(feedPath('task-manager', dataRoot), null);
const processFeed = readJson(feedPath('process', dataRoot), null);
const pidCoverage = readJson(feedPath('pid-coverage', dataRoot), null);
const lirisWatch = readJson(feedPath('liris-watch', dataRoot), null);

if (!task?.rows?.length || !pidCoverage?.rows?.length) {
  feed.ok = false;
  feed.reason = 'task_manager_or_pid_coverage_missing';
  feed.summary = { rows: 0 };
  feed.rows = [];
  feed.errors.push({
    type: 'missing_input_feed',
    task_manager_ok: Boolean(task?.rows?.length),
    pid_coverage_ok: Boolean(pidCoverage?.rows?.length)
  });
} else {
  const observed = pidCoverage.rows.filter((row) => row.observed);
  const host8Priority = observed.filter((row) => row.target_runtime === 'host8-priority');
  const host8Candidate = observed.filter((row) => row.target_runtime === 'host8-candidate');
  const bridges = observed.filter((row) => row.kind === 'mcp-bridge' || row.target_runtime === 'bridge-later');
  const dark = pidCoverage.unmatched_relevant || [];
  const rooms = processRoomStubs().map((room) => {
    const live = observed.find((row) => row.room_stub === room.room_stub);
    return {
      ...room,
      state: live ? 'live' : 'stubbed',
      os_pid: live?.os_pid ?? null,
      ports_tcp_listen: live?.ports_tcp_listen ?? []
    };
  });

  feed.summary = {
    rows: pidCoverage.rows.length,
    total_processes: task.summary?.total_processes || task.rows.length,
    total_memory_mb: task.summary?.total_memory_mb || 0,
    observed_catalog_processes: observed.length,
    binding_gaps: pidCoverage.summary?.binding_gaps || 0,
    host8_priority_live: host8Priority.length,
    host8_candidate_live: host8Candidate.length,
    bridge_processes_live: bridges.length,
    dark_processes: dark.length,
    process_classes: task.summary?.classes || summarizeBy(task.rows, 'command_class')
  };
  feed.rows = observed.map((row) => ({
    id: row.id,
    kind: row.kind,
    os_pid: row.os_pid,
    ports_tcp_listen: row.ports_tcp_listen,
    target_runtime: row.target_runtime,
    cube: row.cube,
    room_stub: row.room_stub,
    binding_state: row.binding_state,
    target_supervisor: row.target_supervisor,
    target_prof: row.target_prof
  }));
  feed.panels = {
    host8_priority: host8Priority.map((row) => ({ id: row.id, os_pid: row.os_pid, ports_tcp_listen: row.ports_tcp_listen, room_stub: row.room_stub, swap_priority: row.swap_priority })),
    host8_candidate: host8Candidate.map((row) => ({ id: row.id, os_pid: row.os_pid, ports_tcp_listen: row.ports_tcp_listen, room_stub: row.room_stub, swap_priority: row.swap_priority })),
    bridges: bridges.map((row) => ({ id: row.id, os_pid: row.os_pid, room_stub: row.room_stub })),
    dark_processes: dark,
    rooms,
    liris_watch: lirisWatch?.summary || { receipt_found: false }
  };
  feed.authority = {
    ...feed.authority,
    read_only: true,
    control_enabled: false,
    starts_processes: false,
    target_state: 'task_manager_absorbed_but_not_yet_controller'
  };
}

const output = feedPath('asolaria-task-manager', dataRoot);
writeJson(output, feed);

const rows = [
  hbpRow('ASOTMHDR', {
    ok: feed.ok ? 1 : 0,
    feed: 'asolaria-task-manager',
    generated_at: feed.generated_at,
    total_processes: feed.summary?.total_processes || 0,
    observed_catalog_processes: feed.summary?.observed_catalog_processes || 0,
    binding_gaps: feed.summary?.binding_gaps || 0,
    json: 0
  }),
  hbpRow('ASOTMSUMMARY', {
    host8_priority_live: feed.summary?.host8_priority_live || 0,
    host8_candidate_live: feed.summary?.host8_candidate_live || 0,
    bridge_processes_live: feed.summary?.bridge_processes_live || 0,
    dark_processes: feed.summary?.dark_processes || 0,
    total_memory_mb: feed.summary?.total_memory_mb || 0
  })
];
for (const row of feed.rows || []) {
  rows.push(hbpRow('ASOTMROW', {
    id: row.id,
    kind: row.kind,
    os_pid: row.os_pid ?? '',
    ports: (row.ports_tcp_listen || []).join(','),
    target_runtime: row.target_runtime || '',
    cube: row.cube || '',
    room_stub: row.room_stub || '',
    binding_state: row.binding_state || ''
  }));
}
for (const room of feed.panels?.rooms || []) {
  rows.push(hbpRow('ASOTMROOM', {
    room_stub: room.room_stub,
    state: room.state,
    os_pid: room.os_pid ?? '',
    target_runtime: room.target_runtime || '',
    swap_priority: room.swap_priority || 0
  }));
}
writeText(feedSidecarPath('asolaria-task-manager', 'hbp', dataRoot), `${rows.join('\n')}\n`);

console.log(JSON.stringify({ ok: true, feed: 'asolaria-task-manager', rows: feed.rows.length, available: feed.ok, path: output }, null, 2));
