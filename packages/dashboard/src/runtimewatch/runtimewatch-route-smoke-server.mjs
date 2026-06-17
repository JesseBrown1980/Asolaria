import http from 'node:http';
import { sendAsolariaTaskManagerPage, sendRuntimeWatchFeed, sendRuntimeWatchSnapshot } from './runtimewatch-server-adapter.mjs';

const dataRootIndex = process.argv.indexOf('--data-root');
const dataRoot = dataRootIndex >= 0 && process.argv[dataRootIndex + 1]
  ? process.argv[dataRootIndex + 1]
  : 'C:/Users/rayss/Asolaria/data/runtimewatch-smoke-full';
const portIndex = process.argv.indexOf('--port');
const port = Number(portIndex >= 0 && process.argv[portIndex + 1] ? process.argv[portIndex + 1] : 4997);

const server = http.createServer((req, res) => {
  if (req.url === '/task-manager' || req.url === '/super-os/task-manager') {
    sendAsolariaTaskManagerPage(req, res);
    return;
  }
  if (req.url === '/api/asolaria-task-manager' || req.url?.startsWith('/api/asolaria-task-manager?')) {
    sendRuntimeWatchFeed(req, res, 'asolaria-task-manager', dataRoot);
    return;
  }
  if (req.url === '/api/runtimewatch/snapshot' || req.url?.startsWith('/api/runtimewatch/snapshot?')) {
    sendRuntimeWatchSnapshot(req, res, dataRoot);
    return;
  }
  if (req.url?.startsWith('/api/runtimewatch/feed/')) {
    const name = decodeURIComponent(req.url.slice('/api/runtimewatch/feed/'.length).split('?')[0] || '');
    sendRuntimeWatchFeed(req, res, name, dataRoot);
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, reason: 'not_found' }, null, 2));
});

server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ ok: true, routes: ['/api/runtimewatch/snapshot', '/api/runtimewatch/feed/:name', '/api/asolaria-task-manager', '/task-manager'], port, dataRoot }, null, 2));
});
