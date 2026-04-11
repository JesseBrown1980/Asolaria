#!/usr/bin/env node
/**
 * build-evidence-package.js — legal evidence package for jesse's Brazilian case vs Google
 *
 * Pulls EVERYTHING related:
 *   - All Google Play purchase receipts (the existing CSV)
 *   - All OneMt correspondence (the Rise of Kings publisher)
 *   - All Flexion Mobile correspondence (the distributor)
 *   - All legal case correspondence (Brazilian lawyer + related)
 *   - All Google support / refund / complaint threads
 *   - Rise of Kings-specific messages subset
 *
 * Bundles into:
 *   reports/legal/evidence-package/
 *     00-README.md
 *     01-all-google-purchases.csv (+ manifest)
 *     02-rise-of-kings-subset.csv
 *     03-onemt-correspondence/*.eml-text.md
 *     04-flexion-mobile-correspondence/*.eml-text.md
 *     05-legal-case-correspondence/*.eml-text.md
 *     06-google-support-refund-complaints/*.eml-text.md
 *     99-master-manifest.json (sha256 chain of every file)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const ROOT = 'C:/Users/acer/Asolaria';
const PKG_DIR = path.join(ROOT, 'reports/legal/evidence-package');
const SUBDIRS = ['03-onemt-correspondence', '04-flexion-mobile-correspondence', '05-legal-case-correspondence', '06-google-support-refund-complaints'];
SUBDIRS.forEach(d => fs.mkdirSync(path.join(PKG_DIR, d), { recursive: true }));

const vaultModule = require(path.join(ROOT, 'src/secureVault.js'));
const oauth = vaultModule.getSecret('integrations.google.oauth').value;
const accounts = vaultModule.getSecret('integrations.google.accounts').value;
const accountsList = Object.entries(accounts.accounts).map(([k, v]) => ({ email: v.email || k, ...v })).filter(a => a.refresh_token);

function postForm(host, pathname, form) { return new Promise((res, rej) => { const body = Object.entries(form).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'); const req = https.request({hostname:host,port:443,path:pathname,method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)}}, r => { let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }}); }); req.on('error', rej); req.write(body); req.end(); }); }
function get(host, pathname, tok) { return new Promise((res, rej) => { const req = https.request({hostname:host,port:443,path:pathname,method:'GET',headers:{'authorization':`Bearer ${tok}`}}, r => { let c = []; r.on('data', d => c.push(d)); r.on('end', () => { try { res({status: r.statusCode, body: JSON.parse(Buffer.concat(c).toString())}); } catch(e) { res({status: r.statusCode, body: Buffer.concat(c).toString()}); }}); }); req.on('error', rej); req.end(); }); }

async function listAll(token, q) {
  let all = [];
  let nextPage = null;
  do {
    const ptq = nextPage ? `&pageToken=${encodeURIComponent(nextPage)}` : '';
    const r = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=500&includeSpamTrash=true${ptq}`, token);
    if (r.status !== 200) return { error: r.status };
    all = all.concat(r.body.messages || []);
    nextPage = r.body.nextPageToken || null;
  } while (nextPage);
  return { messages: all };
}

function extractBody(msg) {
  let text = '';
  let html = '';
  function walk(p) {
    if (!p) return;
    if (p.body && p.body.data) {
      const decoded = Buffer.from(p.body.data, 'base64url').toString('utf8');
      if (p.mimeType && p.mimeType.includes('html')) html += decoded + '\n';
      else text += decoded + '\n';
    }
    if (p.parts) p.parts.forEach(walk);
  }
  walk(msg.payload);
  return { text, html };
}

function sanitizeFilename(s) {
  return String(s || 'untitled').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, '_').slice(0, 100);
}

async function sweepCategory(token, acctEmail, queries, subdir, fileRegistry) {
  const candidateIds = new Set();
  for (const q of queries) {
    const r = await listAll(token, q);
    if (r.error) continue;
    r.messages.forEach(m => candidateIds.add(m.id));
  }
  let saved = 0;
  for (const id of candidateIds) {
    if (fileRegistry.has(id)) continue; // cross-account dedup
    fileRegistry.add(id);
    try {
      const full = await get('gmail.googleapis.com', `/gmail/v1/users/me/messages/${id}?format=full`, token);
      if (full.status !== 200) continue;
      const msg = full.body;
      const h = msg.payload.headers || [];
      const subject = (h.find(x => x.name.toLowerCase() === 'subject') || {}).value || '';
      const from = (h.find(x => x.name.toLowerCase() === 'from') || {}).value || '';
      const to = (h.find(x => x.name.toLowerCase() === 'to') || {}).value || '';
      const dateH = (h.find(x => x.name.toLowerCase() === 'date') || {}).value || '';
      const { text, html } = extractBody(msg);
      const bodyRaw = text + (html ? '\n=== HTML PART ===\n' + html : '');
      const bodyText = bodyRaw.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
      const sha = crypto.createHash('sha256').update(bodyRaw).digest('hex');

      // Use ISO date prefix for sortability
      let isoDate = new Date(dateH).toISOString().slice(0, 10);
      if (isoDate === 'Invalid Date') isoDate = '9999-99-99';
      const filename = `${isoDate}__${sanitizeFilename(subject)}__${id.slice(0,8)}.md`;
      const fullPath = path.join(PKG_DIR, subdir, filename);
      const content = [
        '---',
        `gmail_message_id: ${id}`,
        `account: ${acctEmail}`,
        `date_header: ${dateH}`,
        `from: ${from}`,
        `to: ${to}`,
        `subject: ${subject}`,
        `body_sha256: ${sha}`,
        `snippet: ${msg.snippet ? msg.snippet.replace(/\n/g, ' ').slice(0, 300) : ''}`,
        '---',
        '',
        '# ' + subject,
        '',
        '**From:** ' + from,
        '**To:** ' + to,
        '**Date:** ' + dateH,
        '**SHA256:** `' + sha + '`',
        '',
        '## Body (extracted text)',
        '',
        bodyText,
        '',
        '## Raw body (tamper-evident)',
        '',
        '```',
        bodyRaw.slice(0, 50000), // cap per-file to 50KB raw to avoid bloat
        '```',
        bodyRaw.length > 50000 ? `\n*(truncated at 50KB — full body is ${bodyRaw.length} bytes, sha256 is of the full body)*` : ''
      ].join('\n');
      fs.writeFileSync(fullPath, content);
      saved++;
    } catch (e) {
      // skip fetch errors
    }
  }
  return saved;
}

(async () => {
  const startTs = Date.now();
  const masterManifest = {
    generated_ts: new Date().toISOString(),
    purpose: 'Legal evidence package for Jesse Daniel Brown Brazilian lawsuit against Google re: Rise of Kings in-app purchase dispute',
    case_context: 'Brazilian consumer law case (CDC). Plaintiff alleges Google allowed unauthorized charges through the Rise of Kings app. Initial ruling 2024-12-17 was unfavorable per lawyer correspondence. Case continues on appeal or related actions.',
    generated_by: 'asolaria-instance@acer via tools/legal/build-evidence-package.js',
    authority: 'Jesse Daniel Brown verbal authorization 2026-04-07 + integrations.google.oauth vault credential + cloud-platform scope',
    authorized_accounts: accountsList.map(a => a.email),
    unreachable_accounts: ['jesse@jbrowndevelopmentllc.com', 'plasmatoid@jbrowndevelopmentllc.com'],
    unreachable_reason: 'invalid_grant reauth_required — OAuth refresh tokens expired, need re-auth via browser',
    files: {},
    categories: {}
  };

  const globalIdRegistry = new Set();

  for (const acct of accountsList) {
    console.log(`\n=== ${acct.email} ===`);
    const t = await postForm('oauth2.googleapis.com', '/token', {
      client_id: oauth.clientId, client_secret: oauth.clientSecret,
      refresh_token: acct.refresh_token, grant_type: 'refresh_token'
    });
    if (t.status !== 200) continue;
    const token = t.body.access_token;

    // Category 3: OneMt (Rise of Kings publisher)
    const onemt = await sweepCategory(token, acct.email, [
      'OneMt',
      'one-mt',
      '"One-MT"',
      'from:onemt.com',
      'from:cs@flexionmobile.com OneMt'
    ], '03-onemt-correspondence', globalIdRegistry);
    console.log(`  OneMt: ${onemt} messages saved`);

    // Category 4: Flexion Mobile
    const flexion = await sweepCategory(token, acct.email, [
      '"Flexion Mobile"',
      'from:cs@flexionmobile.com',
      'from:flexionmobile.com',
      'Flexion'
    ], '04-flexion-mobile-correspondence', globalIdRegistry);
    console.log(`  Flexion Mobile: ${flexion} messages saved`);

    // Category 5: Legal case correspondence
    const legal = await sweepCategory(token, acct.email, [
      'from:carlos.magalhaes@aasp.org.br',
      '"Carlos Henrique Bitencourt"',
      '"aasp.org.br"',
      '"Ação Judicial"',
      '"Google Brasil"',
      '"Sinstro"',
      '"Sinistro"',
      '"recurso" Google',
      'subject:"Google recurso"',
      'from:carmen.anagennisi@gmail.com',
      '"lawsuit" Google',
      '"advogado" Google',
      '"processo" Google Rise'
    ], '05-legal-case-correspondence', globalIdRegistry);
    console.log(`  Legal case: ${legal} messages saved`);

    // Category 6: Google support / refund / complaint threads
    const support = await sweepCategory(token, acct.email, [
      'from:googleplay-help@google.com',
      'from:play-support@google.com',
      'subject:"refund" Google',
      '"refund request" Google',
      'from:noreply@google.com refund',
      '"Google Play Support"',
      '"We\'ve received your request"',
      '"We\'re sorry" refund',
      'case:*',
      'from:play-refunds@google.com',
      '"unauthorized purchase"',
      '"unauthorized charge"'
    ], '06-google-support-refund-complaints', globalIdRegistry);
    console.log(`  Support/refund: ${support} messages saved`);

    masterManifest.categories[acct.email] = { onemt, flexion, legal, support };
  }

  // Copy the existing all-google-purchases.csv into the package as 01-
  const srcCsv = path.join(ROOT, 'reports/legal/all-google-purchases.csv');
  const dstCsv = path.join(PKG_DIR, '01-all-google-purchases.csv');
  if (fs.existsSync(srcCsv)) {
    fs.copyFileSync(srcCsv, dstCsv);
    const csvBuf = fs.readFileSync(dstCsv);
    masterManifest.files['01-all-google-purchases.csv'] = {
      bytes: csvBuf.length,
      sha256: crypto.createHash('sha256').update(csvBuf).digest('hex')
    };
  }

  // Filter 02-rise-of-kings-subset.csv — only rows with non-empty rise_flag
  if (fs.existsSync(dstCsv)) {
    const lines = fs.readFileSync(dstCsv, 'utf8').split('\n');
    const header = lines[0];
    const riseCol = header.split(',').indexOf('rise_flag');
    const riseLines = [header];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      // Basic csv parse for the rise_flag column
      const fields = [];
      let cur = '', inQ = false;
      for (const ch of lines[i]) {
        if (inQ) { if (ch === '"') inQ = false; else cur += ch; }
        else { if (ch === '"') inQ = true; else if (ch === ',') { fields.push(cur); cur = ''; } else cur += ch; }
      }
      fields.push(cur);
      if (fields[riseCol] && fields[riseCol].trim() && fields[riseCol].trim() !== '""') riseLines.push(lines[i]);
    }
    const riseSubset = riseLines.join('\n');
    const rsPath = path.join(PKG_DIR, '02-rise-of-kings-subset.csv');
    fs.writeFileSync(rsPath, riseSubset);
    masterManifest.files['02-rise-of-kings-subset.csv'] = {
      bytes: Buffer.byteLength(riseSubset),
      sha256: crypto.createHash('sha256').update(riseSubset).digest('hex'),
      row_count: riseLines.length - 1
    };
  }

  // Hash every file in the package
  for (const sub of SUBDIRS) {
    const dir = path.join(PKG_DIR, sub);
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const p = path.join(dir, f);
      const buf = fs.readFileSync(p);
      masterManifest.files[`${sub}/${f}`] = {
        bytes: buf.length,
        sha256: crypto.createHash('sha256').update(buf).digest('hex')
      };
    }
  }

  // README
  const readme = `# Legal Evidence Package — Jesse Daniel Brown v. Google (Brazil)

**Generated:** ${masterManifest.generated_ts}
**Purpose:** Evidence package for Brazilian consumer law case against Google regarding unauthorized charges through the Rise of Kings app (published by OneMt, distributed via Flexion Mobile Ltd).

## Contents

| path | description |
|---|---|
| 00-README.md | This file |
| 01-all-google-purchases.csv | Complete set of Google Play + Google payments receipts recovered from Gmail, all accessible accounts |
| 02-rise-of-kings-subset.csv | Subset of 01 filtered to rows referencing Rise of Kings / Rise of Kingdoms / Rise of Civilizations / ROK / OneMt / Lilith |
| 03-onemt-correspondence/ | All email correspondence with OneMt (the Rise of Kings publisher) |
| 04-flexion-mobile-correspondence/ | All email correspondence with Flexion Mobile Ltd (the distributor) |
| 05-legal-case-correspondence/ | Correspondence with Brazilian lawyer Carlos Henrique Bitencourt de Castro Magalhães (aasp.org.br) + case-related messages |
| 06-google-support-refund-complaints/ | Google Play support / refund request / complaint threads |
| 99-master-manifest.json | SHA256 manifest of every file in the package, for tamper-evidence |

## Accounts queried

**Accessible (valid OAuth refresh tokens):**
${accountsList.map(a => '- ' + a.email).join('\n')}

**Unreachable (OAuth refresh tokens expired, reauth required):**
- jesse@jbrowndevelopmentllc.com
- plasmatoid@jbrowndevelopmentllc.com

If the Rise of Kings in-app purchase receipts are not in this package, they may be:
1. On one of the two business accounts above (need re-auth to check)
2. Already deleted from Gmail manually over the years
3. Never emailed by OneMt/Flexion Mobile in the first place (some publishers don't)
4. Only present in the Google Play Order History page (authoritative source)

## Recommended additional evidence source

**Google Takeout Play Order History export** — the authoritative source for in-app purchase history that Google itself retains. Request at takeout.google.com → select "Google Play" → request export. Arrives in 1-24 hours.

## Integrity

Every file in this package has a SHA256 hash recorded in 99-master-manifest.json. Any modification to any file after generation will break the hash chain and is detectable.

## Case context (from correspondence found)

- Brazilian lawyer: **Carlos Henrique Bitencourt de Castro Magalhães** at Associação dos Advogados de São Paulo (aasp.org.br)
- Known case outcome: **Initial ruling unfavorable (2024-12-17)** per lawyer's email of that date. Status of appeal or follow-on action unknown from these records.
- Game: **Rise of Kings** (NOT Rise of Kingdoms or Rise of Civilizations — those are different games)
- Publisher: **OneMt**
- Distributor: **Flexion Mobile Ltd** (cs@flexionmobile.com — confirmed they are distribution-only and cannot access accounts)
- Plaintiff alleges: Google allowed unauthorized charges through the Rise of Kings in-app purchase system

## Honest caveats

1. This package contains only what is reachable via Gmail API today. It is NOT a complete record of all Rise of Kings purchases — those may have been pruned from Gmail long ago.
2. Receipt SHA256 values are hashes of the full raw email body as fetched from Gmail API. They are tamper-evident but do not constitute cryptographic proof of purchase by themselves; they serve as integrity fingerprints for the evidence files.
3. The CSV row count is the total number of Gmail messages matching Google-purchase or Rise-related query patterns, NOT the total number of purchases jesse made. The total number of actual purchases likely far exceeds what is in Gmail.
4. Order IDs extracted via regex (GPA. and SOP. format) are best-effort. Some receipts may not match the regex due to format variations.
5. Two of four Google accounts could not be checked (expired refresh tokens). Those accounts may contain additional relevant evidence.

## Next steps for the lawyer

1. Review 01-all-google-purchases.csv for the full purchase pattern
2. Review 02-rise-of-kings-subset.csv for Rise of Kings-specific references
3. Review 05-legal-case-correspondence/ for prior case state + lawyer correspondence
4. Review 06-google-support-refund-complaints/ for evidence of refund requests + Google's responses
5. Consider requesting Google Takeout Play Order History export as the authoritative purchase record
6. Consider re-authorizing the two business Google accounts to check them for additional evidence

---

Package generated under authorization of Jesse Daniel Brown by asolaria-instance@acer as part of the Asolaria-ASI federation's ongoing work. This package is for use by Jesse Brown and his legal representation ONLY. HD-2 ext class: not for dispatch to any third party.
`;
  fs.writeFileSync(path.join(PKG_DIR, '00-README.md'), readme);
  const readmeBuf = fs.readFileSync(path.join(PKG_DIR, '00-README.md'));
  masterManifest.files['00-README.md'] = { bytes: readmeBuf.length, sha256: crypto.createHash('sha256').update(readmeBuf).digest('hex') };

  masterManifest.elapsed_seconds = Math.round((Date.now() - startTs) / 1000);
  masterManifest.total_files = Object.keys(masterManifest.files).length;
  masterManifest.total_bytes = Object.values(masterManifest.files).reduce((a, b) => a + b.bytes, 0);

  fs.writeFileSync(path.join(PKG_DIR, '99-master-manifest.json'), JSON.stringify(masterManifest, null, 2));
  const manifestBuf = fs.readFileSync(path.join(PKG_DIR, '99-master-manifest.json'));
  const manifestSha = crypto.createHash('sha256').update(manifestBuf).digest('hex');

  console.log('\n=== PACKAGE BUILT ===');
  console.log(JSON.stringify({
    total_files: masterManifest.total_files,
    total_bytes: masterManifest.total_bytes,
    package_dir: PKG_DIR,
    master_manifest_sha256: manifestSha,
    elapsed_s: masterManifest.elapsed_seconds,
    categories: masterManifest.categories
  }, null, 2));
})();
