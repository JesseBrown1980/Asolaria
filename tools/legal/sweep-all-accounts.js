#!/usr/bin/env node
// Sweep all 4 Google accounts in the vault for Google Play receipt counts + Rise of Kingdoms matches
'use strict';
const https = require('https');
const path = require('path');
const ROOT = 'C:/Users/acer/Asolaria';
const vaultModule = require(path.join(ROOT, 'src/secureVault.js'));
const oauth = vaultModule.getSecret('integrations.google.oauth').value;
const accounts = vaultModule.getSecret('integrations.google.accounts').value;
const accountsList = Object.entries(accounts.accounts).map(([k,v]) => ({email: v.email || k, ...v}));

function postForm(host, pathname, form) { return new Promise((res, rej) => { const body = Object.entries(form).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); const req = https.request({hostname:host,port:443,path:pathname,method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)}}, r => { let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }}); }); req.on('error', rej); req.write(body); req.end(); }); }
function get(host, pathname, tok) { return new Promise((res, rej) => { const req = https.request({hostname:host,port:443,path:pathname,method:'GET',headers:{'authorization':`Bearer ${tok}`}}, r => { let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }}); }); req.on('error', rej); req.end(); }); }

async function countAllPages(token, q) {
  let total = 0;
  let nextPage = null;
  let pages = 0;
  do {
    pages++;
    const ptq = nextPage ? `&pageToken=${encodeURIComponent(nextPage)}` : '';
    const r = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=500${ptq}`, token);
    if (r.status !== 200) return { error: r.status, body: r.body };
    total += (r.body.messages || []).length;
    nextPage = r.body.nextPageToken || null;
    if (pages > 100) { return { error: 'page_cap', total }; }
  } while (nextPage);
  return { total, pages };
}

(async () => {
  for (const acct of accountsList) {
    console.log('\n=== ' + acct.email + ' ===');
    if (!acct.refresh_token) { console.log('  no refresh token'); continue; }
    const t = await postForm('oauth2.googleapis.com', '/token', { client_id: oauth.clientId, client_secret: oauth.clientSecret, refresh_token: acct.refresh_token, grant_type: 'refresh_token' });
    if (t.status !== 200) { console.log('  refresh failed:', t.status, JSON.stringify(t.body).slice(0, 300)); continue; }
    const token = t.body.access_token;

    const profile = await get('gmail.googleapis.com', '/gmail/v1/users/me/profile', token);
    if (profile.status !== 200) { console.log('  profile failed:', profile.status); continue; }
    console.log('  messagesTotal:', profile.body.messagesTotal);

    const queries = [
      'from:googleplay-noreply@google.com',
      'from:payments-noreply@google.com',
      'from:noreply@google.com Play',
      'Rise of Kingdoms',
      'Rise of Civilizations',
      'Lilith',
      'lilithgames',
      'com.lilith',
      'GPA.',
      'SOP.',
      'from:googleplay-noreply@google.com "Rise"',
      'from:googleplay-noreply@google.com "Lilith"',
      '"ROK"'
    ];
    for (const q of queries) {
      const r = await countAllPages(token, q);
      if (r.error) {
        console.log('  ' + JSON.stringify({q, error: r.error}));
      } else {
        console.log('  ' + JSON.stringify({q, total: r.total, pages: r.pages}));
      }
    }
  }
})();
