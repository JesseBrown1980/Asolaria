# RuntimeWatch Tab Patch Template

Target file:

```text
C:/asolaria-acer/packages/dashboard/src/super-os-viz/super-os-tabs-v3.html
```

Goal: make the RuntimeWatch tab consume `/api/runtimewatch/snapshot` and show degraded states without hanging.

## HTML target

Inside the RuntimeWatch tab/panel body, add or replace with a container:

```html
<section class="runtimewatch-panel">
  <div class="runtimewatch-authority" id="runtimewatch-authority">RuntimeWatch: loading…</div>
  <div class="runtimewatch-grid" id="runtimewatch-grid"></div>
</section>
```

## JS

Add this script near existing dashboard refresh scripts:

```html
<script>
async function loadRuntimeWatchSnapshot() {
  const authorityEl = document.getElementById('runtimewatch-authority');
  const grid = document.getElementById('runtimewatch-grid');
  if (!authorityEl || !grid) return;

  let data;
  try {
    const res = await fetch('/api/runtimewatch/snapshot', { cache: 'no-store' });
    data = await res.json();
  } catch (error) {
    authorityEl.textContent = `RuntimeWatch unavailable: ${error?.message || error}`;
    grid.innerHTML = '';
    return;
  }

  const authority = data.authority || {};
  authorityEl.textContent = `RuntimeWatch authority: read_only=${authority.read_only === true}; dashboard_starts_producers=${authority.dashboard_starts_producers === true}; control_routes_enabled=${authority.control_routes_enabled === true}`;

  const feeds = data.feeds || {};
  const cards = Object.entries(feeds).map(([name, feed]) => {
    const ok = feed?.ok === true;
    const stale = feed?.stale === true;
    const reason = feed?.reason || (ok ? 'ok' : 'degraded');
    const rows = Array.isArray(feed?.rows) ? `<div class="muted">rows: ${feed.rows.length}</div>` : '';
    const summary = feed?.summary ? `<pre>${escapeHtml(JSON.stringify(feed.summary, null, 2)).slice(0, 1200)}</pre>` : '';
    return `<article class="runtimewatch-card ${ok ? 'ok' : 'degraded'} ${stale ? 'stale' : ''}">
      <h3>${escapeHtml(name)}</h3>
      <div>ok: ${ok}</div>
      <div>stale: ${stale}</div>
      <div>reason: ${escapeHtml(reason)}</div>
      ${rows}
      ${summary}
    </article>`;
  }).join('');
  grid.innerHTML = cards || '<div class="runtimewatch-card degraded">No feed snapshot yet. Run the aggregator manually.</div>';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

loadRuntimeWatchSnapshot();
setInterval(loadRuntimeWatchSnapshot, 5000);
</script>
```

## CSS

```html
<style>
.runtimewatch-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.runtimewatch-card { border: 1px solid rgba(120, 180, 255, .25); border-radius: 12px; padding: 12px; background: rgba(8, 14, 24, .78); }
.runtimewatch-card.ok { border-color: rgba(80, 220, 160, .45); }
.runtimewatch-card.degraded { border-color: rgba(255, 190, 80, .55); }
.runtimewatch-card.stale { opacity: .68; }
.runtimewatch-card pre { max-height: 160px; overflow: auto; white-space: pre-wrap; }
.runtimewatch-authority { margin-bottom: 12px; color: #9ecbff; }
</style>
```

## Verification

Open:

```text
http://127.0.0.1:4949/
```

Then open the RuntimeWatch tab and confirm:

```text
CPU card appears
GPU may show not_available
Liris may show not_running_or_no_receipt
Authority shows read_only=true and control_routes_enabled=false
```
