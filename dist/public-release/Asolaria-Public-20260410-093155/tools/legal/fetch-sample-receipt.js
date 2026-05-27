#!/usr/bin/env node
'use strict';
const https = require('https');
const path = require('path');
const ROOT = 'C:/Users/acer/Asolaria';
const vaultModule = require(path.join(ROOT, 'src/secureVault.js'));
const oauth = vaultModule.getSecret('integrations.google.oauth').value;
const accounts = vaultModule.getSecret('integrations.google.accounts').value;
const p = Object.entries(accounts.accounts).map(([k,v]) => ({email: v.email || k, ...v})).find(a => a.email.toLowerCase() === 'plasmatoid@gmail.com');
function postForm(host, pathname, form) { return new Promise((res, rej) => { const body = Object.entries(form).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); const req = https.request({hostname:host,port:443,path:pathname,method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)}}, r => { let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }}); }); req.on('error', rej); req.write(body); req.end(); }); }
function get(host, pathname, tok) { return new Promise((res, rej) => { const req = https.request({hostname:host,port:443,path:pathname,method:'GET',headers:{'authorization':`Bearer ${tok}`}}, r => { let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }}); }); req.on('error', rej); req.end(); }); }

(async () => {
  const t = await postForm('oauth2.googleapis.com', '/token', { client_id: oauth.clientId, client_secret: oauth.clientSecret, refresh_token: p.refresh_token, grant_type: 'refresh_token' });
  const token = t.body.access_token;

  // Fetch 3 recent googleplay-noreply messages to see actual shape
  const list = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages?q=${encodeURIComponent('from:googleplay-noreply@google.com')}&maxResults=3`, token);
  console.log('list.status:', list.status);
  console.log('resultSizeEstimate:', list.body.resultSizeEstimate);
  console.log('messages count:', (list.body.messages||[]).length);

  for (const m of (list.body.messages || [])) {
    const full = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages/${m.id}?format=full`, token);
    if (full.status !== 200) continue;
    const msg = full.body;
    const h = msg.payload.headers || [];
    const subject = (h.find(x => x.name.toLowerCase() === 'subject') || {}).value || '';
    const from = (h.find(x => x.name.toLowerCase() === 'from') || {}).value || '';
    const dateH = (h.find(x => x.name.toLowerCase() === 'date') || {}).value || '';
    let body = '';
    function walk(pp) { if (!pp) return; if (pp.body && pp.body.data) body += Buffer.from(pp.body.data, 'base64url').toString('utf8') + '\n---\n'; if (pp.parts) pp.parts.forEach(walk); }
    walk(msg.payload);
    // Strip html tags for readable body
    const text = body.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 1500);
    console.log('===');
    console.log('id:', m.id);
    console.log('from:', from);
    console.log('subject:', subject);
    console.log('date:', dateH);
    console.log('snippet:', msg.snippet);
    console.log('body extract (first 1500 chars, stripped):', text);
  }

  // Also check date range of results — list with after:2017
  const list2 = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages?q=${encodeURIComponent('from:googleplay-noreply@google.com after:2017/01/01')}&maxResults=1`, token);
  console.log('\nfrom:googleplay-noreply after:2017/01/01 estimate:', list2.body.resultSizeEstimate, 'messages:', (list2.body.messages || []).length);

  // Full count via pagination ping
  let total = 0;
  let nextPage = null;
  let pages = 0;
  do {
    pages++;
    const ptq = nextPage ? `&pageToken=${encodeURIComponent(nextPage)}` : '';
    const r = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages?q=${encodeURIComponent('from:googleplay-noreply@google.com')}&maxResults=500${ptq}`, token);
    if (r.status !== 200) { console.log('page', pages, 'status:', r.status); break; }
    total += (r.body.messages || []).length;
    nextPage = r.body.nextPageToken || null;
    console.log('page', pages, 'added', (r.body.messages || []).length, 'total_so_far:', total, 'has_next:', !!nextPage);
    if (pages > 50) { console.log('page cap hit'); break; }
  } while (nextPage);
  console.log('FINAL TOTAL from:googleplay-noreply@google.com:', total);
})();
