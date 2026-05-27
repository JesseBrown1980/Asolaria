#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
merge-v5.py — bilateral v5 paper merge.

Takes acer's v4 (with Jesse-placeholder paragraphs + sweep abstract decision)
and replaces my placeholder Appendix B / Bibliography / Author block with
liris's REAL versions from skeleton-v4-pre-jesse-additions.md. Also adds
liris's Appendix F (device registry expanded), Figures section, AI
contribution statement.

Keeps my Jesse-placeholder paragraphs (§1.2, §3.2, §10.2) + abstract decision
intact for jesse to revise.
"""

import io
import sys
import hashlib
import re

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

V4_ACER_PATH = r'C:\Users\acer\Asolaria\reports\asolaria-asi-paper\skeleton-v4-full-merge-acer.md'
V4_LIRIS_PATH = r'C:\Users\acer\Asolaria\data\omni-processor\paper-draft\incoming\paper-draft\skeleton-v4-pre-jesse-additions.md'
V5_OUT = r'C:\Users\acer\Asolaria\reports\asolaria-asi-paper\skeleton-v5-full-merge-acer.md'


def extract_section(text, header_starts_with, end_markers):
    """Extract a section from text starting at a header line that begins with
    `header_starts_with` and ending at the next line matching any of `end_markers`
    or at end of text. Returns the section text including the start header but
    not including the end marker line.
    """
    idx = text.find(header_starts_with)
    if idx == -1:
        return None
    end_idx = -1
    for marker in end_markers:
        pos = text.find(marker, idx + len(header_starts_with))
        if pos != -1 and (end_idx == -1 or pos < end_idx):
            end_idx = pos
    if end_idx == -1:
        return text[idx:]
    return text[idx:end_idx]


def replace_section(text, header_starts_with, end_markers, new_section):
    """Replace a section in text identified by header_starts_with + end_markers
    with new_section. Returns modified text. If section not found, returns
    text unchanged with a warning.
    """
    idx = text.find(header_starts_with)
    if idx == -1:
        print('WARN: section not found:', repr(header_starts_with[:60]))
        return text
    end_idx = -1
    for marker in end_markers:
        pos = text.find(marker, idx + len(header_starts_with))
        if pos != -1 and (end_idx == -1 or pos < end_idx):
            end_idx = pos
    if end_idx == -1:
        return text[:idx] + new_section
    return text[:idx] + new_section + text[end_idx:]


def main():
    with io.open(V4_ACER_PATH, 'r', encoding='utf-8') as f:
        v4_acer = f.read()
    with io.open(V4_LIRIS_PATH, 'r', encoding='utf-8') as f:
        v4_liris = f.read()

    print('v4_acer size:', len(v4_acer))
    print('v4_liris size:', len(v4_liris))

    v5 = v4_acer

    # === Replace Appendix B with liris's full LX-485 to LX-491 version ===
    liris_app_b = extract_section(
        v4_liris,
        '## Appendix B — Full LX chain LX-485 through LX-491 with cosign records',
        ['\n## Appendix F', '\n## Bibliography', '\n## Figures', '\n## Author', '\n---']
    )
    if liris_app_b:
        # Find acer's appendix B (which is a placeholder)
        acer_app_b_start = '## Appendix B — Complete LX chain'
        v5 = replace_section(v5, acer_app_b_start, ['\n---\n', '\n## Bibliography', '\n## Authors'], liris_app_b.rstrip() + '\n\n---\n\n')
        print('replaced Appendix B with liris version (LX-485 → LX-491 full)')
    else:
        print('WARN: liris Appendix B not extracted')

    # === Replace Bibliography with liris's real cites ===
    liris_bib = extract_section(
        v4_liris,
        '## Bibliography (real cites drafted)',
        ['\n## Figures', '\n## Author', '\n---']
    )
    if liris_bib:
        # Liris's header is "Bibliography (real cites drafted)" — normalize
        liris_bib_normalized = liris_bib.replace(
            '## Bibliography (real cites drafted)',
            '## Bibliography (real cites — liris contribution v4 sprint, jesse to confirm formatting + add §1.2/§10.2 references when his paragraphs land)'
        )
        v5 = replace_section(v5, '## Bibliography\n', ['\n---\n', '\n## Authors'], liris_bib_normalized.rstrip() + '\n\n---\n\n')
        print('replaced Bibliography with liris real cites')
    else:
        print('WARN: liris Bibliography not extracted')

    # === Add Appendix F (device registry expanded) — liris has it, acer didn't ===
    liris_app_f = extract_section(
        v4_liris,
        '## Appendix F — Device registry (expanded)',
        ['\n## Bibliography', '\n## Figures', '\n## Author']
    )
    if liris_app_f:
        # Insert before Appendix B in the new v5 (or after the new Appendix B since it's the new section just added)
        # Actually insert after the bibliography for now — Appendix F belongs in the appendices block
        # Find a place to insert: after the last appendix (right before Bibliography in the v5 structure)
        bib_idx = v5.find('## Bibliography')
        if bib_idx != -1:
            v5 = v5[:bib_idx] + liris_app_f.rstrip() + '\n\n---\n\n' + v5[bib_idx:]
            print('inserted Appendix F (device registry expanded) before Bibliography')
        else:
            v5 = v5.rstrip() + '\n\n---\n\n' + liris_app_f.rstrip() + '\n'
            print('appended Appendix F to end (no bibliography anchor found)')
    else:
        print('WARN: liris Appendix F not extracted')

    # === Add Figures section ===
    liris_figs = extract_section(
        v4_liris,
        '## Figures (textual descriptions',
        ['\n## Author', '\n---', '\n## Bibliography']
    )
    if liris_figs:
        # Insert after Bibliography
        bib_end = v5.find('### Brown prior work')
        if bib_end == -1:
            bib_end = v5.find('## Authors')
        if bib_end != -1:
            v5 = v5[:bib_end].rstrip() + '\n\n---\n\n' + liris_figs.rstrip() + '\n\n---\n\n' + v5[bib_end:]
        else:
            v5 = v5.rstrip() + '\n\n---\n\n' + liris_figs.rstrip() + '\n'
        print('inserted Figures section')
    else:
        print('WARN: liris Figures not extracted')

    # === Replace Author block with liris's much more detailed version ===
    liris_authors = extract_section(
        v4_liris,
        '## Author affiliations + ethics + data availability',
        ['\n## Cleanup pass notes', '\n## Dispatch info', '\n---\n\n**Status']
    )
    if liris_authors:
        # Acer's authors block is at "## Authors, affiliations"
        v5 = replace_section(v5, '## Authors, affiliations, license, ethics, data availability', ['\n# End', '\n---\n\n**Status'], liris_authors.rstrip() + '\n\n---\n\n')
        print('replaced Author block with liris version (detailed AI contribution statement)')
    else:
        print('WARN: liris Authors block not extracted')

    # === Update title to v5 ===
    v5 = re.sub(
        r'\*\*Status:\*\* \u26a0\ufe0f DRAFT SKELETON v[0-9]+',
        '**Status:** \u26a0\ufe0f DRAFT SKELETON v5',
        v5
    )

    # === Add a v5 changelog section near the top ===
    v5_changelog = """

## v5 changelog (acer-side bilateral merge)

**v5 changes from v4:**

1. **Appendix B replaced** with liris's full LX-485 → LX-491 narrative (was: acer's summary table-only version)
2. **Appendix F added** (device registry expanded — NovaLUM + Beast + Felipe A06 + Xiaomi) — was missing entirely from acer v4
3. **Bibliography replaced** with liris's real cites organized by category (was: 23 acer placeholder entries)
4. **Figures section added** with 7 textual descriptions (trinity stack, dual-engine convergence, LX chain, 24D cube, dispatch latency, orphan workload, LCR enforcement flow) — was missing from acer v4
5. **Author block + Ethics + Data availability + AI contribution statement** replaced with liris's much more detailed versions (her AI contribution statement attributes every section to a specific contributor + lists every cosign phrase verbatim — significantly more thorough than acer's placeholder)
6. **Cleanup pass notes** acknowledged but NOT yet applied (10 items, mostly tone/format polish — left for v6 polish pass after jesse visual review)
7. **Jesse-placeholder paragraphs preserved** (§1.2, §3.2, §10.2) — these are still DRAFT FOR JESSE REVIEW from v4 acer push
8. **Abstract decision preserved** (B for arXiv + A as extended in §1.2.5) — still pending jesse override

**v5 federation pattern**: this is the 7th cross-host document share if dispatched. Both sides have alternated cleanly: acer-v0, liris-v1, acer-v2, liris-v2, liris-v3, acer-v4, liris-v4-pre-jesse, **acer-v5 = bilateral merge**. The next move is jesse's 3 paragraph revisions + visual review pass.

---
"""
    # Insert the changelog right after the title block
    title_end = v5.find('\n## ⚠️ OPERATOR VISUAL REVIEW REQUIRED')
    if title_end != -1:
        v5 = v5[:title_end] + v5_changelog + v5[title_end:]
        print('inserted v5 changelog')

    # Write v5
    with io.open(V5_OUT, 'w', encoding='utf-8') as f:
        f.write(v5)

    sha = hashlib.sha256(v5.encode('utf-8')).hexdigest()
    print('v5 size:', len(v5), 'bytes')
    print('v5 sha256:', sha)
    print('v5 path:', V5_OUT)


if __name__ == '__main__':
    main()
