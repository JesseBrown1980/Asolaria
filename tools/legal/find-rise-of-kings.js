#!/usr/bin/env node
// Find Rise of Kings receipts specifically, dump actual content so we can see what's in them
'use strict';
const https = require('https');
const path = require('path');
const ROOT = 'C:/Users/acer/Asolaria';
const vaultModule = require(path.join(ROOT, 'src/secureVault.js'));
const oauth = vaultModule.getSecret('integrations.google.oauth').value;
const accounts = vaultModule.getSecret('integrations.google.accounts').value;
const accountsList = Object.entries(accounts.accounts).map(([k,v]) => ({email: v.email || k, ...v})).filter(a => a.refresh_token);

function postForm(host, pathname, form) { return new Promise((res, rej) => { const body = Object.entries(form).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); const req = https.request({hostname:host,port:443,path:pathname,method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)}}, r => { let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }}); }); req.on('error', rej); req.write(body); req.end(); }); }
function get(host, pathname, tok) { return new Promise((res, rej) => { const req = https.request({hostname:host,port:443,path:pathname,method:'GET',headers:{'authorization':`Bearer ${tok}`}}, r => { let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }}); }); req.on('error', rej); req.end(); }); }

async function listAll(token, q) {
  let all = [];
  let nextPage = null;
  do {
    const ptq = nextPage ? `&pageToken=${encodeURIComponent(nextPage)}` : '';
    const r = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=500${ptq}`, token);
    if (r.status !== 200) return { error: r.status };
    all = all.concat(r.body.messages || []);
    nextPage = r.body.nextPageToken || null;
  } while (nextPage);
  return { messages: all };
}

async function fetchFull(token, id) {
  return get('gmail.googleapis.com', `/gmail/v1/users/me/messages/${id}?format=full`, token);
}

function extractBody(msg) {
  let body = '';
  function walk(p) { if (!p) return; if (p.body && p.body.data) body += Buffer.from(p.body.data, 'base64url').toString('utf8') + '\n---\n'; if (p.parts) p.parts.forEach(walk); }
  walk(msg.payload);
  return body.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

(async () => {
  for (const acct of accountsList) {
    console.log('\n====== ' + acct.email + ' ======');
    const t = await postForm('oauth2.googleapis.com', '/token', { client_id: oauth.clientId, client_secret: oauth.clientSecret, refresh_token: acct.refresh_token, grant_type: 'refresh_token' });
    if (t.status !== 200) { console.log('token failed'); continue; }
    const token = t.body.access_token;

    const queries = [
      '"Rise of Kings"',
      '"Rise of Kingdoms"',
      '"Rise of Civilizations"',
      '"ROK"',
      'from:googleplay-noreply@google.com'
    ];
    for (const q of queries) {
      const r = await listAll(token, q);
      if (r.error) { console.log(q, 'err', r.error); continue; }
      console.log('\n-- query:', q, '-- count:', r.messages.length);
      // Pull first 3 full messages to see actual content
      for (let i = 0; i < Math.min(3, r.messages.length); i++) {
        const full = await fetchFull(token, r.messages[i].id);
        if (full.status !== 200) continue;
        const h = full.body.payload.headers || [];
        const subject = (h.find(x => x.name.toLowerCase() === 'subject') || {}).value || '';
        const from = (h.find(x => x.name.toLowerCase() === 'from') || {}).value || '';
        const date = (h.find(x => x.name.toLowerCase() === 'date') || {}).value || '';
        const snippet = (full.body.snippet || '').slice(0, 250);
        console.log('  [' + i + '] from=' + from + ' | date=' + date);
        console.log('      subject=' + subject);
        console.log('      snippet=' + snippet);
      }
    }
  }
})();
