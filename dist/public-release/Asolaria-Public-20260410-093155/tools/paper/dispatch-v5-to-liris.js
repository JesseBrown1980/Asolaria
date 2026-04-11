#!/usr/bin/env node
// Dispatch skeleton-v5-full-merge-acer.md to liris via POST /omni/submit
// using document-share-v0 unit. Schema-bridge v2 compatible (envelope.target).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

const FILE_PATH = 'C:\\Users\\acer\\Asolaria\\reports\\asolaria-asi-paper\\skeleton-v5-full-merge-acer.md';
const PEER_TOKENS = 'C:\\Users\\acer\\Asolaria\\data\\vault\\owner\\agent-keyboard\\peer-tokens.json';
const TARGET_FILE_NAME = 'skeleton-v5-full-merge-acer.md';
const TARGET_SUBDIR = 'paper-draft';

const peers = JSON.parse(fs.readFileSync(PEER_TOKENS, 'utf8'));
const liris = peers.peers['liris-rayssa'];
const url = new URL(liris.url + '/omni/submit');

const buf = fs.readFileSync(FILE_PATH);
const sha = crypto.createHash('sha256').update(buf).digest('hex');
const b64 = buf.toString('base64');

console.log('file:', FILE_PATH);
console.log('size:', buf.length);
console.log('sha256:', sha);
console.log('target:', url.toString());

const manifest = {
  job_id: 'acer-v5-paper-dispatch-' + Date.now(),
  target: {
    unit_id: 'document-share-v0',
    version: '0.1.0',
    host: 'liris-rayssa',
    novalum_shield_check: true
  },
  input: {
    file_name: TARGET_FILE_NAME,
    content_base64: b64,
    sha256: sha,
    total_bytes: buf.length,
    target_subdir: TARGET_SUBDIR,
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
    const txt = Buffer.concat(chunks).toString('utf8');
    console.log('status:', res.statusCode);
    console.log('response:', txt);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});
req.on('error', e => { console.error('ERR:', e.message); process.exit(2); });
req.on('timeout', () => { console.error('TIMEOUT'); req.destroy(); process.exit(3); });
req.write(body);
req.end();
