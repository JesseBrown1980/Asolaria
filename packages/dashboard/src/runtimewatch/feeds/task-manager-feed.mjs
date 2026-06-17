import { baseFeed, boundedRun, dataRootFromArg, feedPath, redactCommandLine, writeJson } from '../runtimewatch-utils.mjs';

function commandClass(command = '', name = '') {
  const text = `${name} ${command}`.toLowerCase();
  if (text.includes('node')) return 'node';
  if (text.includes('python')) return 'python';
  if (text.includes('hermes')) return 'hermes';
  if (text.includes('codex')) return 'codex';
  if (text.includes('opencode')) return 'opencode';
  if (text.includes('chrome') || text.includes('msedge')) return 'browser';
  if (text.includes('powershell')) return 'powershell';
  if (text.includes('cmd.exe')) return 'cmd';
  return 'process';
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') {
      cur += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parsePowerShellCsv(text) {
  const lines = String(text || '').split(/\r?\n/g).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const parts = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((h, i) => [h, parts[i] || '']));
    const pid = Number(row.Id || 0);
    const ppid = Number(row.ParentProcessId || 0);
    const name = row.ProcessName || 'unknown';
    const memoryMb = Math.round((Number(row.WorkingSet64 || 0) || 0) / 1024 / 1024);
    const cpuSeconds = Number(row.CPU || 0) || 0;
    const command = row.CommandLine || '';
    return {
      pid,
      ppid,
      name,
      memory_mb: memoryMb,
      cpu_seconds: Number(cpuSeconds.toFixed(2)),
      command_class: commandClass(command, name),
      command_redacted: redactCommandLine(command || name),
      started_at: row.CreationDate || null
    };
  }).filter((row) => row.pid > 0);
}

const dataRoot = dataRootFromArg();
const feed = baseFeed('task-manager', 'powershell:Get-CimInstance Win32_Process');
const ps = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine,WorkingSetSize,CreationDate | ForEach-Object { [pscustomobject]@{ Id=$_.ProcessId; ParentProcessId=$_.ParentProcessId; ProcessName=$_.Name; CommandLine=$_.CommandLine; WorkingSet64=$_.WorkingSetSize; CreationDate=$_.CreationDate; CPU=0 } } | ConvertTo-Csv -NoTypeInformation';
let result = boundedRun('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], { timeout: 5000 });

if (result.status !== 0 && result.error) {
  result = boundedRun('pwsh.exe', ['-NoProfile', '-Command', ps], { timeout: 5000 });
}

if (result.status === 0 && result.stdout.trim()) {
  const allRows = parsePowerShellCsv(result.stdout);
  const rows = allRows
    .sort((a, b) => b.memory_mb - a.memory_mb)
    .slice(0, 512);
  feed.rows = rows;
  feed.summary = {
    rows: rows.length,
    total_processes: allRows.length,
    top_memory_mb: rows[0]?.memory_mb || 0,
    total_memory_mb: rows.reduce((sum, row) => sum + (row.memory_mb || 0), 0),
    classes: rows.reduce((acc, row) => ({ ...acc, [row.command_class || 'unknown']: (acc[row.command_class || 'unknown'] || 0) + 1 }), {})
  };
} else {
  feed.ok = false;
  feed.reason = 'process_probe_unavailable';
  feed.rows = [];
  feed.summary = { rows: 0 };
  feed.errors.push({
    type: 'task_manager_probe_failed',
    status: result.status,
    signal: result.signal,
    error: result.error,
    stderr: result.stderr.slice(0, 500),
    timed_out: result.timed_out
  });
}

const output = feedPath('task-manager', dataRoot);
writeJson(output, feed);
console.log(JSON.stringify({ ok: true, feed: 'task-manager', rows: feed.rows.length, available: feed.ok, path: output }, null, 2));
