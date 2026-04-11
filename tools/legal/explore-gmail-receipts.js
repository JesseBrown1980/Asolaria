#!/usr/bin/env node
// Exploratory: find the actual shape of Google Play receipts on plasmatoid@gmail.com
// Tries multiple sender + subject patterns to locate the real receipt emails.

'use strict';
const https = require('https');
const path = require('path');
const ROOT = 'C:/Users/acer/Asolaria';
const vaultModule = require(path.join(ROOT, 'src/secureVault.js'));

const rawOauth = vaultModule.getSecret('integrations.google.oauth');
const rawAccounts = vaultModule.getSecret('integrations.google.accounts');
const oauth = rawOauth && rawOauth.value ? rawOauth.value : rawOauth;
const accounts = rawAccounts && rawAccounts.value ? rawAccounts.value : rawAccounts;
const accountsList = accounts && accounts.accounts ? Object.entries(accounts.accounts).map(([k,v]) => ({email: v.email || k, ...v})) : [];
const p = accountsList.find(a => a.email.toLowerCase() === 'plasmatoid@gmail.com');
if (!p) { console.error('no plasmatoid'); process.exit(1); }

function postForm(host, pathname, form) {
  return new Promise((res, rej) => {
    const body = Object.entries(form).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const req = https.request({hostname:host,port:443,path:pathname,method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)}}, r => {
      let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }});
    });
    req.on('error', rej); req.write(body); req.end();
  });
}
function get(host, pathname, tok) {
  return new Promise((res, rej) => {
    const req = https.request({hostname:host,port:443,path:pathname,method:'GET',headers:{'authorization':`Bearer ${tok}`}}, r => {
      let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }});
    });
    req.on('error', rej); req.end();
  });
}

(async () => {
  const t = await postForm('oauth2.googleapis.com', '/token', {
    client_id: oauth.clientId, client_secret: oauth.clientSecret,
    refresh_token: p.refresh_token, grant_type: 'refresh_token'
  });
  const token = t.body.access_token;
  console.log(JSON.stringify({stage:'token',ok:t.status===200}));

  // Exploratory queries
  const queries = [
    'from:googleplay-noreply@google.com',
    'from:noreply@google.com Play',
    'from:payments-noreply@google.com',
    'from:play.google.com',
    '"Rise of Kingdoms"',
    '"Rise of Civilizations"',
    '"Google Play Order"',
    '"Your Google Play order receipt"',
    '"Rise of Kings"',
    'Lilith',
    'in-app purchase',
    'Google Play purchase',
    'Play Store Lilith',
    'Google Play Rise',
    'from:googleplay',
    'from:google.com Lilith',
    // Broader — check labels
    'label:all subject:"Rise"',
    'subject:receipt Rise',
    'subject:"order" Rise'
  ];

  for (const q of queries) {
    const r = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=5`, token);
    const count = r.body && r.body.resultSizeEstimate !== undefined ? r.body.resultSizeEstimate : 'n/a';
    const msgs = r.body && r.body.messages ? r.body.messages.length : 0;
    console.log(JSON.stringify({q, count, msgs_returned: msgs}));
  }

  // Also check which labels exist + include SPAM/TRASH?
  const labels = await get('gmail.googleapis.com', '/gmail/v1/users/me/labels', token);
  console.log(JSON.stringify({labels_count: labels.body && labels.body.labels ? labels.body.labels.length : 0, label_names: labels.body && labels.body.labels ? labels.body.labels.map(l => l.name).slice(0,30) : []}));

  // Try with includeSpamTrash
  const q2 = 'Rise of Kingdoms';
  const r2 = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages?q=${encodeURIComponent(q2)}&maxResults=5&includeSpamTrash=true`, token);
  console.log(JSON.stringify({q:q2, includeSpamTrash:true, count: r2.body && r2.body.resultSizeEstimate, msgs: r2.body && r2.body.messages ? r2.body.messages.length : 0}));
})();
