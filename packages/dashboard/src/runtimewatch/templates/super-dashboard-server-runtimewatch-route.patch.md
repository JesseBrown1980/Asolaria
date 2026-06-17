# RuntimeWatch Route Patch Template

Target file:

```text
C:/asolaria-acer/packages/dashboard/src/super-os-viz/super-dashboard-server.mjs
```

Goal: add a read-only route. The route must only read `runtimewatch-snapshot-latest.json`; it must never start producers.

## Import

Near the top-level imports, add the correct relative import. From `src/super-os-viz/super-dashboard-server.mjs` to `src/runtimewatch/runtimewatch-server-adapter.mjs`, the expected relative path is:

```js
import { sendRuntimeWatchSnapshot } from '../runtimewatch/runtimewatch-server-adapter.mjs';
```

If the server file is in a different directory, adjust only the relative path.

## Constants

Near existing data-root constants, add:

```js
const RUNTIMEWATCH_DATA_ROOT = process.env.ASOLARIA_RUNTIMEWATCH_ROOT || 'C:/asolaria-acer/data/runtimewatch';
```

## Route

In the HTTP request router, before generic static handling, add:

```js
if (req.url === '/api/runtimewatch/snapshot' || req.url?.startsWith('/api/runtimewatch/snapshot?')) {
  sendRuntimeWatchSnapshot(req, res, RUNTIMEWATCH_DATA_ROOT);
  return;
}
```

## Verification

```text
node --check C:/asolaria-acer/packages/dashboard/src/super-os-viz/super-dashboard-server.mjs
node C:/asolaria-acer/packages/dashboard/src/runtimewatch/runtimewatch-aggregator.mjs --data-root C:/asolaria-acer/data/runtimewatch
curl http://127.0.0.1:4949/api/runtimewatch/snapshot
```

Expected: JSON response with:

```json
{
  "schema": "asolaria.runtimewatch.snapshot.v1",
  "authority": {
    "dashboard_starts_producers": false,
    "aggregator_probes_system": false,
    "control_routes_enabled": false,
    "read_only": true
  }
}
```
