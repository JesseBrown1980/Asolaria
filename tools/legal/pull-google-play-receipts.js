#!/usr/bin/env node
/**
 * pull-google-play-receipts.js — legal deliverable for jesse's case vs Google
 *
 * Pulls ALL Google Play Store purchase receipts for "Rise of Kingdoms"
 * (and variant names) from plasmatoid@gmail.com from 2017-01-01 to today.
 *
 * Authority: jesse 2026-04-07 verbal authorization + vault stores the
 * integrations.google.oauth credentials for plasmatoid.
 *
 * Output:
 *   reports/legal/rise-of-kingdoms-purchases.csv (incremental, row-by-row)
 *   reports/legal/rise-of-kingdoms-purchases.progress.json (every 100 rows)
 *   reports/legal/rise-of-kingdoms-purchases.manifest.json (final sha256 + metadata)
 *
 * Never prints credentials to stdout. Only row counts + progress.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const ROOT = 'C:/Users/acer/Asolaria';
const OUT_DIR = path.join(ROOT, 'reports/legal');
const CSV_PATH = path.join(OUT_DIR, 'rise-of-kingdoms-purchases.csv');
const PROGRESS_PATH = path.join(OUT_DIR, 'rise-of-kingdoms-purchases.progress.json');
const MANIFEST_PATH = path.join(OUT_DIR, 'rise-of-kingdoms-purchases.manifest.json');

fs.mkdirSync(OUT_DIR, { recursive: true });

// --- Load vault credentials ---
// The secureVault module reads from vault.master.key if env/dpapi not set
const vaultModule = require(path.join(ROOT, 'src/secureVault.js'));

let oauth, accounts;
try {
  const rawOauth = vaultModule.getSecret('integrations.google.oauth');
  const rawAccounts = vaultModule.getSecret('integrations.google.accounts');
  // Vault returns wrapper {namespace, name, value, createdAt, updatedAt, meta}; actual payload in .value
  oauth = rawOauth && rawOauth.value ? rawOauth.value : rawOauth;
  accounts = rawAccounts && rawAccounts.value ? rawAccounts.value : rawAccounts;
} catch (e) {
  console.error(JSON.stringify({ stage: 'vault_decrypt', ok: false, error: e.message }));
  process.exit(2);
}

// Safe metadata print (NO tokens)
const scopes = oauth && (oauth.scope || oauth.scopes);
const clientId = oauth && (oauth.clientId || oauth.client_id);
const clientSecret = oauth && (oauth.clientSecret || oauth.client_secret);

// Accounts — may be an array, an object keyed by email, or a wrapper with .accounts
let accountsList = [];
const rawAccountsPayload = accounts && accounts.accounts ? accounts.accounts : accounts;
if (Array.isArray(rawAccountsPayload)) {
  accountsList = rawAccountsPayload;
} else if (rawAccountsPayload && typeof rawAccountsPayload === 'object') {
  // Object keyed by email OR by some identifier; flatten to array with email field
  accountsList = Object.entries(rawAccountsPayload).map(([k, v]) => {
    if (v && typeof v === 'object') {
      return { email: v.email || v.emailAddress || k, ...v };
    }
    return { email: k };
  });
}

console.log(JSON.stringify({ stage: 'accounts_shape', count: accountsList.length, keys_sample: accountsList.length > 0 ? Object.keys(accountsList[0]) : [], emails: accountsList.map(a => a && (a.email || a.emailAddress || '<unknown>')) }));

// Find plasmatoid account
const plasmatoidAccount = accountsList.find(a =>
  String((a && (a.email || a.emailAddress)) || '').toLowerCase().includes('plasmatoid')
);

const safeMeta = {
  stage: 'vault_decrypt',
  ok: true,
  oauth_has_client_id: !!clientId,
  oauth_has_client_secret: !!clientSecret,
  oauth_scope: scopes,
  accounts_count: accountsList.length,
  accounts_emails: accountsList.map(a => a && (a.email || a.emailAddress || '<unknown>')),
  plasmatoid_found: !!plasmatoidAccount,
  plasmatoid_has_refresh_token: !!(plasmatoidAccount && (plasmatoidAccount.refresh_token || plasmatoidAccount.refreshToken)),
  plasmatoid_fields: plasmatoidAccount ? Object.keys(plasmatoidAccount) : null
};
console.log(JSON.stringify(safeMeta));

// If plasmatoid account not found or has no refresh token, halt
if (!plasmatoidAccount) {
  console.error(JSON.stringify({ stage: 'precheck', ok: false, error: 'plasmatoid_account_not_found', available: safeMeta.accounts_emails }));
  process.exit(3);
}
if (!(plasmatoidAccount.refresh_token || plasmatoidAccount.refreshToken)) {
  console.error(JSON.stringify({ stage: 'precheck', ok: false, error: 'plasmatoid_has_no_refresh_token', fields: safeMeta.plasmatoid_fields }));
  process.exit(3);
}

const scope = Array.isArray(scopes) ? scopes.join(' ') : String(scopes || '');
if (!/gmail/i.test(scope) && !/mail\.google/i.test(scope)) {
  console.error(JSON.stringify({ stage: 'precheck', ok: false, error: 'oauth_scope_does_not_include_gmail', scope }));
  process.exit(4);
}

console.log(JSON.stringify({ stage: 'precheck', ok: true, scope_has_gmail: true, account: plasmatoidAccount.email || plasmatoidAccount.emailAddress }));

// --- Refresh access token ---
function postForm(host, pathname, formObj) {
  return new Promise((resolve, reject) => {
    const body = Object.entries(formObj).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const req = https.request({
      hostname: host,
      port: 443,
      path: pathname,
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': Buffer.byteLength(body)
      }
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const txt = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(txt) }); }
        catch (e) { resolve({ status: res.statusCode, body: txt }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(host, pathname, accessToken) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host,
      port: 443,
      path: pathname,
      method: 'GET',
      headers: {
        'authorization': `Bearer ${accessToken}`,
        'accept': 'application/json'
      }
    }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const txt = Buffer.concat(chunks).toString('utf8');
        try { resolve({ status: res.statusCode, body: JSON.parse(txt) }); }
        catch (e) { resolve({ status: res.statusCode, body: txt }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  let accessToken;
  try {
    const refreshResp = await postForm('oauth2.googleapis.com', '/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: plasmatoidAccount.refresh_token || plasmatoidAccount.refreshToken,
      grant_type: 'refresh_token'
    });
    if (refreshResp.status !== 200) {
      console.error(JSON.stringify({ stage: 'refresh_token', ok: false, status: refreshResp.status, body: refreshResp.body }));
      process.exit(5);
    }
    accessToken = refreshResp.body.access_token;
    console.log(JSON.stringify({
      stage: 'refresh_token',
      ok: true,
      expires_in_seconds: refreshResp.body.expires_in,
      scope: refreshResp.body.scope
    }));
  } catch (e) {
    console.error(JSON.stringify({ stage: 'refresh_token', ok: false, error: e.message }));
    process.exit(5);
  }

  // --- Verify account identity ---
  try {
    const profile = await httpsGet('gmail.googleapis.com', '/gmail/v1/users/me/profile', accessToken);
    console.log(JSON.stringify({
      stage: 'profile',
      ok: profile.status === 200,
      email: profile.body && profile.body.emailAddress,
      messages_total: profile.body && profile.body.messagesTotal
    }));
    if (profile.status !== 200) {
      console.error(JSON.stringify({ stage: 'profile', ok: false, status: profile.status, body: profile.body }));
      process.exit(6);
    }
  } catch (e) {
    console.error(JSON.stringify({ stage: 'profile', ok: false, error: e.message }));
    process.exit(6);
  }

  // --- Search for receipts with pagination ---
  // Broad query; we filter by product title in receipt body later
  const searchQueries = [
    'from:googleplay-noreply@google.com "Rise of Kingdoms" after:2017/01/01',
    'from:googleplay-noreply@google.com "Rise of Civilizations" after:2017/01/01',
    'from:googleplay-noreply@google.com "Rise of Kings" after:2017/01/01'
  ];

  // Write CSV header
  const csvHeader = 'order_id,date_utc,product_title,sku,price_usd,payment_method_last4,receipt_sha256,gmail_message_id,raw_subject\n';
  fs.writeFileSync(CSV_PATH, csvHeader);

  let totalRows = 0;
  const seenMessageIds = new Set();
  const startTs = Date.now();

  function escapeCsv(s) {
    if (s === null || s === undefined) return '';
    const str = String(s).replace(/"/g, '""');
    return /[",\n]/.test(str) ? `"${str}"` : str;
  }

  function extractBodyText(msg) {
    // Walk the payload tree for text/plain or text/html parts
    const parts = [];
    function walk(p) {
      if (!p) return;
      if (p.body && p.body.data) {
        parts.push(Buffer.from(p.body.data, 'base64url').toString('utf8'));
      }
      if (p.parts) p.parts.forEach(walk);
    }
    walk(msg.payload);
    return parts.join('\n');
  }

  function parseReceipt(bodyText, subject, messageId) {
    // Try to extract order ID (GPA.XXXX-XXXX-XXXX-XXXXX format)
    const orderMatch = bodyText.match(/GPA\.[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4,6}/);
    const orderId = orderMatch ? orderMatch[0] : '';

    // Product title — look for common Rise of Kingdoms patterns
    let productTitle = '';
    const productMatch = bodyText.match(/(?:Item:|Product:|Product name:)\s*(.+?)(?:\n|$)/i)
      || bodyText.match(/Rise of (Kingdoms|Civilizations|Kings)[^\n]*/i);
    if (productMatch) productTitle = productMatch[0].slice(0, 200).trim();

    // Price
    const priceMatch = bodyText.match(/\$([0-9]+\.[0-9]{2})/);
    const priceUsd = priceMatch ? priceMatch[1] : '';

    // Payment method last 4
    const last4Match = bodyText.match(/(?:ending in|ending with|\*{3,}|Visa|Mastercard)[^0-9]{0,20}([0-9]{4})/i);
    const last4 = last4Match ? last4Match[1] : '';

    // Date — look for standard date patterns in the receipt
    let dateUtc = '';
    const dateMatch = bodyText.match(/(?:Order date:|Purchase date:|Date:)\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
    if (dateMatch) dateUtc = dateMatch[1];

    // SKU
    const skuMatch = bodyText.match(/(?:SKU|Item ID|Product ID):\s*([A-Za-z0-9._-]+)/i);
    const sku = skuMatch ? skuMatch[1] : '';

    // Receipt body sha256 for tamper-evidence
    const receiptSha = crypto.createHash('sha256').update(bodyText).digest('hex');

    return { orderId, dateUtc, productTitle, sku, priceUsd, last4, receiptSha };
  }

  for (const q of searchQueries) {
    console.log(JSON.stringify({ stage: 'search_query_start', query: q }));
    let pageToken = null;
    let pageCount = 0;
    do {
      pageCount++;
      const qenc = encodeURIComponent(q);
      const ptq = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const listResp = await httpsGet(
        'gmail.googleapis.com',
        `/gmail/v1/users/me/messages?q=${qenc}&maxResults=500${ptq}`,
        accessToken
      );
      if (listResp.status !== 200) {
        console.error(JSON.stringify({ stage: 'messages_list', ok: false, status: listResp.status, body: listResp.body, query: q, page: pageCount }));
        break;
      }
      const ids = (listResp.body.messages || []).map(m => m.id);
      console.log(JSON.stringify({ stage: 'messages_list', ok: true, page: pageCount, ids_this_page: ids.length, total_rows_so_far: totalRows }));

      for (const id of ids) {
        if (seenMessageIds.has(id)) continue;
        seenMessageIds.add(id);
        try {
          const fullResp = await httpsGet(
            'gmail.googleapis.com',
            `/gmail/v1/users/me/messages/${id}?format=full`,
            accessToken
          );
          if (fullResp.status !== 200) continue;
          const msg = fullResp.body;
          const headers = msg.payload && msg.payload.headers ? msg.payload.headers : [];
          const subject = (headers.find(h => h.name.toLowerCase() === 'subject') || {}).value || '';
          const bodyText = extractBodyText(msg);
          const parsed = parseReceipt(bodyText, subject, id);

          // Filter: only include if it actually references Rise of (something)
          if (!/Rise of (Kingdoms|Civilizations|Kings)/i.test(bodyText) && !/Rise of/i.test(subject)) {
            continue;
          }

          const row = [
            parsed.orderId,
            parsed.dateUtc,
            parsed.productTitle,
            parsed.sku,
            parsed.priceUsd,
            parsed.last4,
            parsed.receiptSha,
            id,
            subject
          ].map(escapeCsv).join(',') + '\n';
          fs.appendFileSync(CSV_PATH, row);
          totalRows++;

          if (totalRows % 100 === 0) {
            fs.writeFileSync(PROGRESS_PATH, JSON.stringify({
              last_updated_ts: new Date().toISOString(),
              rows_so_far: totalRows,
              elapsed_seconds: Math.round((Date.now() - startTs) / 1000),
              current_query: q,
              current_page: pageCount
            }, null, 2));
            console.log(JSON.stringify({ stage: 'progress', rows: totalRows, elapsed_s: Math.round((Date.now() - startTs) / 1000) }));
          }
        } catch (e) {
          console.error(JSON.stringify({ stage: 'fetch_message', ok: false, id, error: e.message }));
        }
      }

      pageToken = listResp.body.nextPageToken || null;
    } while (pageToken);
    console.log(JSON.stringify({ stage: 'search_query_complete', query: q, total_rows_so_far: totalRows }));
  }

  // Final manifest with sha256 of the CSV
  const csvBuf = fs.readFileSync(CSV_PATH);
  const csvSha = crypto.createHash('sha256').update(csvBuf).digest('hex');
  const manifest = {
    generated_ts: new Date().toISOString(),
    authority: 'jesse 2026-04-07 verbal authorization + vault integrations.google.oauth credential for plasmatoid@gmail.com',
    account: 'plasmatoid@gmail.com',
    search_queries: searchQueries,
    date_range: '2017-01-01 to today',
    total_rows: totalRows,
    csv_path: CSV_PATH,
    csv_size_bytes: csvBuf.length,
    csv_sha256: csvSha,
    progress_path: PROGRESS_PATH,
    elapsed_seconds: Math.round((Date.now() - startTs) / 1000),
    purpose: 'legal deliverable for jesse case vs Google started ~2017',
    fields: ['order_id','date_utc','product_title','sku','price_usd','payment_method_last4','receipt_sha256','gmail_message_id','raw_subject'],
    honest_notes: [
      'Receipt field extraction uses regex best-effort; some fields may be blank if the receipt format varied over time',
      'Receipts matched by (a) sender googleplay-noreply@google.com AND (b) body text contains "Rise of Kingdoms" or "Rise of Civilizations" or "Rise of Kings"',
      'date_utc is raw format from receipt text, not normalized',
      'receipt_sha256 is tamper-evident fingerprint of the full Gmail body text for legal exhibit purposes'
    ]
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify({ stage: 'complete', ok: true, total_rows: totalRows, csv_path: CSV_PATH, csv_sha256: csvSha, elapsed_s: Math.round((Date.now() - startTs) / 1000) }));
})();
