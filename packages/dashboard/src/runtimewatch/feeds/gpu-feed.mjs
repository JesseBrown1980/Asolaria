import { baseFeed, boundedRun, dataRootFromArg, feedPath, writeJson } from '../runtimewatch-utils.mjs';

function parseNvidiaCsv(text) {
  return String(text || '')
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [name = 'unknown', utilization = '', memoryUsed = '', memoryTotal = '', temperature = ''] = line.split(',').map((part) => part.trim());
      return {
        index,
        name,
        utilization_percent: Number(utilization.replace(/[^0-9.]+/g, '')) || 0,
        memory_used_mb: Number(memoryUsed.replace(/[^0-9.]+/g, '')) || 0,
        memory_total_mb: Number(memoryTotal.replace(/[^0-9.]+/g, '')) || 0,
        temperature_c: Number(temperature.replace(/[^0-9.]+/g, '')) || 0
      };
    });
}

const dataRoot = dataRootFromArg();
const feed = baseFeed('gpu', 'nvidia-smi optional');
const result = boundedRun('nvidia-smi', [
  '--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu',
  '--format=csv,noheader,nounits'
], { timeout: 2500 });

if (result.status === 0 && result.stdout.trim()) {
  feed.gpus = parseNvidiaCsv(result.stdout);
  feed.summary = {
    provider: 'nvidia-smi',
    gpu_count: feed.gpus.length
  };
} else {
  feed.ok = false;
  feed.reason = 'not_available';
  feed.summary = {
    provider: 'nvidia-smi',
    gpu_count: 0
  };
  feed.errors.push({
    type: 'gpu_probe_unavailable',
    status: result.status,
    signal: result.signal,
    error: result.error,
    stderr: result.stderr.slice(0, 500),
    timed_out: result.timed_out
  });
}

const output = feedPath('gpu', dataRoot);
writeJson(output, feed);
console.log(JSON.stringify({ ok: true, feed: 'gpu', available: feed.ok, path: output }, null, 2));
