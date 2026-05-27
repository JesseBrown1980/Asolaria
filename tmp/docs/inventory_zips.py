import zipfile, os, datetime

dl = r'C:\Users\acer\Downloads'
zips = [
    os.path.join(dl, 'asolaria-claude-project-bundle.zip'),
    os.path.join(dl, 'asolaria-claude-project-bundle-v2.zip'),
    os.path.join(dl, 'asolaria-claude-project-bundle-v3.zip'),
    os.path.join(dl, 'asolaria-claude-project-bundle-v4.zip'),
    os.path.join(dl, 'asolaria-claude-project-bundle-v5.zip'),
    os.path.join(dl, 'asolaria_shared_processing_and_startup_truth.zip'),
    os.path.join(dl, 'asolaria_shared_processing_and_startup_truth (1).zip'),
    os.path.join(dl, 'asolaria_shared_processing_and_startup_truth (2).zip'),
    os.path.join(dl, 'asolaria_shared_processing_and_startup_truth (3).zip'),
    os.path.join(dl, 'asolaria_shared_processing_and_startup_truth (4).zip'),
    os.path.join(dl, 'gaia-anatomy-for-liris.zip'),
    os.path.join(dl, 'gaia-to-liris-sync.zip'),
    os.path.join(dl, 'liris-anatomy-fix.zip'),
    os.path.join(dl, 'liris-colonyAnatomy.zip'),
    os.path.join(dl, 'liris-colonyAnatomy-final.zip'),
    os.path.join(dl, 'liris-final-cross-exam.zip'),
    os.path.join(dl, 'liris-final-system (1).zip'),
    os.path.join(dl, 'liris-final-system.zip'),
    os.path.join(dl, 'liris-index-restructure.zip'),
    os.path.join(dl, 'liris-merged-20260324.zip'),
]

output = []
output.append('=' * 80)
output.append('ZIP SNAPSHOT INVENTORY -- Asolaria Time Capsules')
output.append('Generated: 2026-03-25')
output.append('Total zips: 20')
output.append('Location: C:\\Users\\acer\\Downloads\\')
output.append('NOTE: Read-only inventory. No zips were extracted or modified.')
output.append('=' * 80)

for zpath in zips:
    output.append('')
    output.append('-' * 80)
    fname = os.path.basename(zpath)
    stat = os.stat(zpath)
    fdate = datetime.datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M')
    fsize_kb = stat.st_size / 1024
    output.append('FILE: ' + fname)
    output.append('DATE: ' + fdate)
    output.append('COMPRESSED SIZE: %.1f KB (%d bytes)' % (fsize_kb, stat.st_size))
    try:
        z = zipfile.ZipFile(zpath, 'r')
        names = z.namelist()
        infos = z.infolist()
        total_uncompressed = sum(i.file_size for i in infos)
        file_count = len([i for i in infos if not i.is_dir()])
        dir_count = len([i for i in infos if i.is_dir()])
        output.append('FILE COUNT: %d files, %d directories' % (file_count, dir_count))
        output.append('TOTAL UNCOMPRESSED: %.1f KB (%d bytes)' % (total_uncompressed / 1024, total_uncompressed))

        ix_files = [n for n in names if '/IX-' in n or n.startswith('IX-')]
        lx_files = [n for n in names if '/LX-' in n or n.startswith('LX-')]
        ledger_files = [n for n in names if 'indexLedger' in n or 'indexCatalogSync' in n]
        catalog_files = [n for n in names if 'CATALOG' in n]
        xref_files = [n for n in names if 'XREF' in n]
        agent_index_dirs = [n for n in names if 'agent-index' in n]

        output.append('')
        output.append('AGENT INDEX MARKERS:')
        if ix_files:
            output.append('  IX-*.md files: %d' % len(ix_files))
            ix_sorted = sorted(ix_files)
            if len(ix_sorted) <= 6:
                for f in ix_sorted:
                    output.append('    ' + f)
            else:
                for f in ix_sorted[:3]:
                    output.append('    ' + f)
                output.append('    ... (%d more)' % (len(ix_sorted) - 6))
                for f in ix_sorted[-3:]:
                    output.append('    ' + f)
        else:
            output.append('  IX-*.md files: NONE')

        if lx_files:
            output.append('  LX-*.md files: %d' % len(lx_files))
            lx_sorted = sorted(lx_files)
            if len(lx_sorted) <= 6:
                for f in lx_sorted:
                    output.append('    ' + f)
            else:
                for f in lx_sorted[:3]:
                    output.append('    ' + f)
                output.append('    ... (%d more)' % (len(lx_sorted) - 6))
                for f in lx_sorted[-3:]:
                    output.append('    ' + f)
        else:
            output.append('  LX-*.md files: NONE')

        if ledger_files:
            output.append('  indexLedger/indexCatalogSync: ' + str(ledger_files))
        if catalog_files:
            output.append('  CATALOG files: ' + str(catalog_files))
        if xref_files:
            output.append('  XREF files: ' + str(xref_files))
        if agent_index_dirs:
            output.append('  agent-index references: %d entries' % len(agent_index_dirs))
        if not any([ix_files, lx_files, ledger_files, catalog_files, xref_files, agent_index_dirs]):
            output.append('  ** NO agent-index content detected **')

        output.append('')
        output.append('CONTENTS (up to 50 entries):')
        for n in names[:50]:
            info = z.getinfo(n)
            if info.is_dir():
                size_str = '     DIR'
            else:
                size_str = '%8d' % info.file_size
            output.append('  %s  %s' % (size_str, n))
        if len(names) > 50:
            output.append('  ... and %d more entries' % (len(names) - 50))
        z.close()
    except Exception as e:
        output.append('ERROR: ' + str(e))

output.append('')
output.append('=' * 80)
output.append('END OF INVENTORY')
output.append('=' * 80)
result = '\n'.join(output)
print(result)

outpath = r'C:\Users\acer\Asolaria\tmp\docs\zip-snapshot-inventory.txt'
os.makedirs(os.path.dirname(outpath), exist_ok=True)
with open(outpath, 'w', encoding='utf-8') as f:
    f.write(result)
print('\n\nSaved to ' + outpath)
