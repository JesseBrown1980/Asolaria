import sys
import os
sys.stdout.reconfigure(encoding='utf-8')

from docx import Document

files = [
    'Liris jesse idea..docx',
    'Liris new.docx',
    'Liris part of start up response.docx',
    'Liris response to Gaias plan.docx',
    'Liris responds to Dans and jesses converationThe record is written.docx',
    'LIRIS recent.docx',
    'Gaia plan and fix.docx',
    'exploration and buildings.docx',
]

src_dir = 'C:/Users/acer/Downloads'
dst_dir = 'C:/Users/acer/Asolaria/tmp/docs'

for fname in files:
    src = os.path.join(src_dir, fname)
    txt_name = os.path.splitext(fname)[0] + '.txt'
    dst = os.path.join(dst_dir, txt_name)

    try:
        doc = Document(src)
        text = '\n'.join(p.text for p in doc.paragraphs)
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(text)
        char_count = len(text)
        preview = text[:200].replace('\n', ' ')
        print(f'OK | {fname} | {char_count} chars')
        print(f'   Preview: {preview}')
    except Exception as e:
        print(f'ERR | {fname} | {e}')
