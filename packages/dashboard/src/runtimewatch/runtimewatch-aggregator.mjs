import { dataRootFromArg, feedPath, markStale, nowIso, readJson, snapshotPath, writeJson } from './runtimewatch-utils.mjs';

const dataRoot = dataRootFromArg();
const feedNames = ['cpu', 'gpu', 'task-manager', 'process', 'pid-coverage', 'asolaria-task-manager', 'liris-watch'];
const feeds = {};
for (const name of feedNames) {
  const row = readJson(feedPath(name, dataRoot), null);
  feeds[name.replace(/-/g, '_')] = row
    ? markStale(row)
    : {
        schema: 'asolaria.runtimewatch.feed.v1',
        ok: false,
        feed: name,
        reason: 'missing_feed_file',
        generated_at: null,
        stale: true,
        authority: {
          read_only: true,
          control_enabled: false,
          starts_processes: false
        },
        errors: []
      };
}
const snapshot = {
  schema: 'asolaria.runtimewatch.snapshot.v1',
  ok: true,
  generated_at: nowIso(),
  mode: 'read_only_microkernel_snapshot',
  feeds,
  authority: {
    dashboard_starts_producers: false,
    aggregator_probes_system: false,
    control_routes_enabled: false,
    read_only: true
  }
};
const output = snapshotPath(dataRoot);
writeJson(output, snapshot);
console.log(JSON.stringify({ ok: true, snapshot: output }, null, 2));
