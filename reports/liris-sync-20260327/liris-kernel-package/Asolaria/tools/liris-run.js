#!/usr/bin/env node
/**
 * Liris Tool Loader — execute tools by number
 *
 * Usage:
 *   node liris-run.js 5          # Run tool #5
 *   node liris-run.js 5 8 20     # Run tools #5, #8, #20 in sequence
 *   node liris-run.js --list      # List all tools (compact)
 *   node liris-run.js --find tag  # Find tools by tag
 *   node liris-run.js --compact   # Ultra-compact list (number:id only)
 *
 * The point: Liris never loads tool source. Just trigger by number.
 * Token cost to select a tool: ~5 tokens (the number).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'data', 'liris-index', 'tool-registry.json');

function loadRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log('liris-run <number> [number...] | --list | --find <tag> | --compact');
  process.exit(0);
}

if (args.includes('--compact')) {
  const reg = loadRegistry();
  for (const t of reg.tools) {
    console.log(`${t.n}:${t.id}`);
  }
  process.exit(0);
}

if (args.includes('--list')) {
  const reg = loadRegistry();
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`${pad('N', 4)} ${pad('ID', 30)} ${pad('DESC', 50)} TAGS`);
  console.log('-'.repeat(100));
  for (const t of reg.tools) {
    console.log(`${pad(t.n, 4)} ${pad(t.id, 30)} ${pad(t.desc, 50)} [${t.tags.join(',')}]`);
  }
  process.exit(0);
}

if (args.includes('--find')) {
  const tag = args[args.indexOf('--find') + 1];
  if (!tag) { console.error('Usage: --find <tag>'); process.exit(1); }
  const reg = loadRegistry();
  const matches = reg.tools.filter(t => t.tags.includes(tag) || t.id.includes(tag) || t.desc.toLowerCase().includes(tag.toLowerCase()));
  for (const t of matches) {
    console.log(`${t.n}: ${t.id} — ${t.desc}`);
  }
  process.exit(0);
}

// Execute by number(s)
const reg = loadRegistry();
const numbers = args.map(Number).filter(n => !isNaN(n));

for (const num of numbers) {
  const tool = reg.tools.find(t => t.n === num);
  if (!tool) {
    console.error(`Tool #${num} not found`);
    continue;
  }
  console.log(`[LIRIS] Running #${num}: ${tool.id}`);
  try {
    const output = execSync(tool.cmd, { cwd: ROOT, timeout: 30000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(output);
  } catch (e) {
    console.error(`[LIRIS] Tool #${num} error:`, e.stderr || e.message);
  }
}
