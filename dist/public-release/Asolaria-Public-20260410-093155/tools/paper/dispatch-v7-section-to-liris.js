#!/usr/bin/env node
// Dispatch arbitrary paper file to liris via document-share-v0
// usage: node dispatch-v7-section-to-liris.js <local-path> <remote-filename>

const fs = require('fs');
const crypto = require('crypto');
const http = require('http');

const LOCAL = process.argv[2];
const REMOTE_NAME = process.argv[3];
if (!LOCAL || !REMOTE_NAME) {
  console.error('usage: dispatch-v7-section-to-liris.js <local-path> <remote-filename>');
  process.exit(1);
}

const PEER_TOKENS = 'C:\\Users\\acer\\Asolaria\\data\\vault\\owner\\agent-keyboard\\peer-tokens.json';
const peers = JSON.parse(fs.readFileSync(PEER_TOKENS, 'utf8'));
const liris = peers.peers['liris-rayssa'];
const url = new URL(liris.url + '/omni/submit');

const buf = fs.readFileSync(LOCAL);
const sha = crypto.createHash('sha256').update(buf).digest('hex');
const b64 = buf.toString('base64');

console.log('local:', LOCAL);
console.log('remote_name:', REMOTE_NAME);
console.log('size:', buf.length);
console.log('sha256:', sha);
console.log('target:', url.toString());

const manifest = {
  job_id: 'acer-v7-paper-section-' + Date.now(),
  target: {
    unit_id: 'document-share-v0',
    version: '0.1.0',
    host: 'liris-rayssa',
    novalum_shield_check: true
  },
  input: {
    file_name: REMOTE_NAME,
    content_base64: b64,
    sha256: sha,
    total_bytes: buf.length,
    target_subdir: 'paper-draft',
    overwrite: true
  }
};

const body = Buffer.from(JSON.stringify(manifest), 'utf8');

const req = http.request({
  hostname: url.hostname,
  port: url.port,
  path: url.pathname,
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'content-length': body.length,
    'authorization': 'Bearer ' + liris.token
  },
  timeout: 90000
}, (res) => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    console.log('status:', res.statusCode);
    console.log('response:', Buffer.concat(chunks).toString('utf8'));
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});
req.on('error', e => { console.error('ERR:', e.message); process.exit(2); });
req.on('timeout', () => { console.error('TIMEOUT'); req.destroy(); process.exit(3); });
req.write(body);
req.end();
