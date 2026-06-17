import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function arg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function slash(value) {
  return String(value || '').replace(/\\/g, '/');
}

function mkdir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  mkdir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(filePath, text) {
  fs.writeFileSync(filePath, text, 'utf8');
}

function patchServer(serverFile, runtimewatchRoot, dataRoot, dryRun) {
  if (!fs.existsSync(serverFile)) {
    return { ok: false, skipped: true, reason: 'server_file_missing', file: serverFile };
  }
  let text = readText(serverFile);
  const original = text;
  const relImport = slash(path.relative(path.dirname(serverFile), path.join(runtimewatchRoot, 'runtimewatch-server-adapter.mjs')));
  const importLine = `import { sendRuntimeWatchSnapshot } from '${relImport.startsWith('.') ? relImport : `./${relImport}`}';`;
  if (!text.includes('sendRuntimeWatchSnapshot')) {
    const importMatch = text.match(/^(import\s+[^\n]+\n)+/m);
    if (importMatch) {
      text = text.replace(importMatch[0], `${importMatch[0]}${importLine}\n`);
    } else {
      text = `${importLine}\n${text}`;
    }
  }
  if (!text.includes('RUNTIMEWATCH_DATA_ROOT')) {
    const constantLine = `const RUNTIMEWATCH_DATA_ROOT = process.env.ASOLARIA_RUNTIMEWATCH_ROOT || '${slash(dataRoot)}';\n`;
    const lastImport = text.lastIndexOf('\nimport ');
    if (lastImport >= 0) {
      const afterImports = text.indexOf('\n', text.indexOf('\n', lastImport) + 1);
      text = `${text.slice(0, afterImports + 1)}\n${constantLine}${text.slice(afterImports + 1)}`;
    } else {
      text = `${constantLine}${text}`;
    }
  }
  if (!text.includes('/api/runtimewatch/snapshot')) {
    const routeBlock = `\n  // RuntimeWatch read-only snapshot route. Never starts producers.\n  if (req.url === '/api/runtimewatch/snapshot' || req.url?.startsWith('/api/runtimewatch/snapshot?')) {\n    sendRuntimeWatchSnapshot(req, res, RUNTIMEWATCH_DATA_ROOT);\n    return;\n  }\n`;
    const patterns = [
      /const\s+server\s*=\s*http\.createServer\s*\(\s*\(req,\s*res\)\s*=>\s*\{/,
      /http\.createServer\s*\(\s*\(req,\s*res\)\s*=>\s*\{/,
      /createServer\s*\(\s*\(req,\s*res\)\s*=>\s*\{/
    ];
    let patched = false;
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const insertAt = match.index + match[0].length;
        text = `${text.slice(0, insertAt)}${routeBlock}${text.slice(insertAt)}`;
        patched = true;
        break;
      }
    }
    if (!patched) {
      return { ok: false, skipped: true, reason: 'router_insertion_point_not_found', file: serverFile };
    }
  }
  if (text !== original && !dryRun) writeText(serverFile, text);
  return { ok: true, changed: text !== original, file: serverFile };
}

function appendTabSnippet(tabFile, dryRun) {
  if (!fs.existsSync(tabFile)) {
    return { ok: false, skipped: true, reason: 'tab_file_missing', file: tabFile };
  }
  let text = readText(tabFile);
  const original = text;
  if (text.includes('runtimewatch-grid') && text.includes('/api/runtimewatch/snapshot')) {
    return { ok: true, changed: false, file: tabFile, reason: 'already_present' };
  }
  const snippet = `\n<!-- RuntimeWatch microkernel read-only panel injected by install-runtimewatch-into-dashboard.mjs -->\n<section class="runtimewatch-panel" id="runtimewatch-panel">\n  <div class="runtimewatch-authority" id="runtimewatch-authority">RuntimeWatch: loading…</div>\n  <div class="runtimewatch-grid" id="runtimewatch-grid"></div>\n</section>\n<style>\n.runtimewatch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }\n.runtimewatch-card { border: 1px solid rgba(120, 180, 255, .25); border-radius: 12px; padding: 12px; background: rgba(8, 14, 24, .78); }\n.runtimewatch-card.ok { border-color: rgba(80, 220, 160, .45); }\n.runtimewatch-card.degraded { border-color: rgba(255, 190, 80, .55); }\n.runtimewatch-card.stale { opacity: .68; }\n.runtimewatch-card pre { max-height: 160px; overflow: auto; white-space: pre-wrap; }\n.runtimewatch-authority { margin-bottom: 12px; color: #9ecbff; }\n</style>\n<script>\nasync function loadRuntimeWatchSnapshot() {\n  const authorityEl = document.getElementById('runtimewatch-authority');\n  const grid = document.getElementById('runtimewatch-grid');\n  if (!authorityEl || !grid) return;\n  let data;\n  try {\n    const res = await fetch('/api/runtimewatch/snapshot', { cache: 'no-store' });\n    data = await res.json();\n  } catch (error) {\n    authorityEl.textContent = \`RuntimeWatch unavailable: \${error?.message || error}\`;\n    grid.innerHTML = '';\n    return;\n  }\n  const authority = data.authority || {};\n  authorityEl.textContent = \`RuntimeWatch authority: read_only=\${authority.read_only === true}; dashboard_starts_producers=\${authority.dashboard_starts_producers === true}; control_routes_enabled=\${authority.control_routes_enabled === true}\`;\n  const feeds = data.feeds || {};\n  const cards = Object.entries(feeds).map(([name, feed]) => {\n    const ok = feed?.ok === true;\n    const stale = feed?.stale === true;\n    const reason = feed?.reason || (ok ? 'ok' : 'degraded');\n    const rows = Array.isArray(feed?.rows) ? \`<div class="muted">rows: \${feed.rows.length}</div>\` : '';\n    const summary = feed?.summary ? \`<pre>\${escapeRuntimeWatchHtml(JSON.stringify(feed.summary, null, 2)).slice(0, 1200)}</pre>\` : '';\n    return \`<article class="runtimewatch-card \${ok ? 'ok' : 'degraded'} \${stale ? 'stale' : ''}"><h3>\${escapeRuntimeWatchHtml(name)}</h3><div>ok: \${ok}</div><div>stale: \${stale}</div><div>reason: \${escapeRuntimeWatchHtml(reason)}</div>\${rows}\${summary}</article>\`;\n  }).join('');\n  grid.innerHTML = cards || '<div class="runtimewatch-card degraded">No feed snapshot yet. Run the aggregator manually.</div>';\n}\nfunction escapeRuntimeWatchHtml(value) {\n  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));\n}\nloadRuntimeWatchSnapshot();\nsetInterval(loadRuntimeWatchSnapshot, 5000);\n</script>\n`;
  if (text.includes('</body>')) text = text.replace('</body>', `${snippet}\n</body>`);
  else text = `${text}\n${snippet}`;
  if (text !== original && !dryRun) writeText(tabFile, text);
  return { ok: true, changed: text !== original, file: tabFile };
}

const dashboardRoot = path.resolve(arg('--dashboard-root', 'C:/asolaria-acer/packages/dashboard/src'));
const dataRoot = path.resolve(arg('--data-root', 'C:/asolaria-acer/data/runtimewatch'));
const dryRun = hasFlag('--dry-run');
const runtimewatchRoot = path.join(dashboardRoot, 'runtimewatch');
const superVizRoot = path.join(dashboardRoot, 'super-os-viz');
const serverFile = arg('--server-file', path.join(superVizRoot, 'super-dashboard-server.mjs'));
const tabFile = arg('--tab-file', path.join(superVizRoot, 'super-os-tabs-v3.html'));

const result = {
  ok: true,
  dry_run: dryRun,
  dashboard_root: dashboardRoot,
  runtimewatch_root: runtimewatchRoot,
  data_root: dataRoot,
  steps: []
};

if (!dryRun) copyDir(__dirname, runtimewatchRoot);
result.steps.push({ ok: true, action: dryRun ? 'would_copy_runtimewatch_folder' : 'copied_runtimewatch_folder', from: __dirname, to: runtimewatchRoot });
result.steps.push(patchServer(serverFile, runtimewatchRoot, dataRoot, dryRun));
result.steps.push(appendTabSnippet(tabFile, dryRun));
result.ok = result.steps.every((step) => step.ok || step.skipped);
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
