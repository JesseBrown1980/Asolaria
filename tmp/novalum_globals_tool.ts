import fs from 'node:fs';
import path from 'node:path';
import { Globals } from 'D:/projects/QDD/ebacmap-master/apps/sync-server/src/models/Globals';
import { parseHexString, parseFields } from 'D:/projects/QDD/ebacmap-master/apps/sync-server/src/utils/parse';

type Mode = 'parse' | 'build';

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const mode = args.mode as Mode | undefined;
if (!mode) throw new Error('--mode parse|build is required');

const model = new Globals();

if (mode === 'parse') {
  const hexPath = args.hex;
  const outPath = args.out;
  if (!hexPath || !outPath) throw new Error('--hex and --out are required for parse');
  const hex = fs.readFileSync(hexPath, 'utf8').trim();
  const parsed = parseHexString(hex, 0);
  if (!parsed?.data) throw new Error('Failed to parse globals hex');
  const fields = parseFields(parsed.data as Uint8Array, model.fields).data;
  fs.writeFileSync(outPath, JSON.stringify(fields, null, 2));
  console.log(outPath);
}

if (mode === 'build') {
  const currentPath = args.current;
  const patchPath = args.patch;
  const outPath = args.out;
  if (!currentPath || !patchPath || !outPath) {
    throw new Error('--current, --patch, and --out are required for build');
  }
  const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
  const patch = JSON.parse(fs.readFileSync(patchPath, 'utf8'));
  const next = { ...current, ...patch };
  const bytes = model.encode(next as any);
  const packet = model.buildWriteCommand(bytes as any);
  fs.writeFileSync(outPath, Buffer.from(packet).toString('hex'));
  const metaPath = path.join(path.dirname(outPath), `${path.parse(outPath).name}.json`);
  fs.writeFileSync(metaPath, JSON.stringify(next, null, 2));
  console.log(outPath);
}
