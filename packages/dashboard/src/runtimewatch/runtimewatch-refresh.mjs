import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DEFAULT_DATA_ROOT } from './runtimewatch-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function arg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const dataRoot = arg('--data-root', DEFAULT_DATA_ROOT);
const steps = [
  'feeds/cpu-feed.mjs',
  'feeds/gpu-feed.mjs',
  'feeds/task-manager-feed.mjs',
  'feeds/process-feed.mjs',
  'feeds/liris-watch-feed.mjs',
  'feeds/pid-coverage-feed.mjs',
  'feeds/asolaria-task-manager-feed.mjs',
  'runtimewatch-aggregator.mjs'
];

const results = [];
let ok = true;

for (const step of steps) {
  const filePath = path.join(__dirname, step);
  const run = spawnSync(process.execPath, [filePath, '--data-root', dataRoot], {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
    shell: false,
    maxBuffer: 1024 * 1024
  });
  const result = {
    step,
    ok: run.status === 0,
    status: run.status,
    signal: run.signal,
    stdout: String(run.stdout || '').trim().slice(0, 4000),
    stderr: String(run.stderr || '').trim().slice(0, 2000)
  };
  results.push(result);
  if (!result.ok) {
    ok = false;
    break;
  }
}

console.log(JSON.stringify({
  ok,
  data_root: dataRoot,
  steps: results
}, null, 2));

if (!ok) process.exitCode = 1;
