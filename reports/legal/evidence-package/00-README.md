# Legal Evidence Package — Jesse Daniel Brown v. Google (Brazil)

**Generated:** 2026-04-07T22:26:38.884Z
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
- plasmatoid@gmail.com
- jessebrown.soft1980@gmail.com
- jesse@jbrowndevelopmentllc.com
- plasmatoid@jbrowndevelopmentllc.com

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
