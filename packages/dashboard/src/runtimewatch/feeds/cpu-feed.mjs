import os from 'node:os';
import { baseFeed, dataRootFromArg, feedPath, writeJson } from '../runtimewatch-utils.mjs';

const dataRoot = dataRootFromArg();
const cpus = os.cpus();
const feed = baseFeed('cpu', 'node:os');
feed.summary = {
  cpus: cpus.length,
  model: cpus[0]?.model || 'unknown',
  speed_mhz: cpus[0]?.speed || 0,
  loadavg: os.loadavg(),
  platform: os.platform(),
  arch: os.arch(),
  uptime_seconds: os.uptime(),
  memory_total_mb: Math.round(os.totalmem() / 1024 / 1024),
  memory_free_mb: Math.round(os.freemem() / 1024 / 1024)
};
const output = feedPath('cpu', dataRoot);
writeJson(output, feed);
console.log(JSON.stringify({ ok: true, feed: 'cpu', path: output }, null, 2));
