import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = path.join(process.cwd(), 'app');
const normalizer = readFileSync(path.join(appDir, 'admin-legacy-theme-normalizer.tsx'), 'utf8');
const bridge = readFileSync(path.join(appDir, 'admin-modern-token-bridge.css'), 'utf8');

const neutralLiterals = [
  '#070b12', '#070b14', '#080808', '#080b0f', '#090f1a', '#0a101c', '#0b1220', '#0c1420', '#0f1726', '#0f172a',
  '#102036', '#11161d', '#111827', '#111c2a', '#131e30', '#172033', '#172437', '#181818', '#181f28', '#18253a', '#1e293b', '#202936',
  '#334155', '#475569', '#5f6f84', '#64748b', '#8a98aa', '#94a3b8', '#9ca3af', '#9caac0', '#c9d3e0', '#cbd5e1',
  '#dfe6ef', '#e2e8f0', '#f3f6fb', '#f7f9fc', '#f8fafc', '#fff', '#ffffff',
];

const literalPattern = new RegExp(neutralLiterals.join('|'), 'ig');

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(css|tsx?)$/.test(entry) && !entry.endsWith('.spec.ts') && !entry.endsWith('.spec.tsx')) out.push(full);
  }
  return out;
}

test('every known legacy neutral palette literal is owned by the computed theme normalizer', () => {
  const used = new Set<string>();
  for (const file of walk(appDir)) {
    if (path.basename(file) === 'admin-legacy-theme-normalizer.tsx') continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(literalPattern)) used.add(match[0].toLowerCase());
  }

  const uncovered = [...used]
    .filter((literal) => literal !== '#fff' && literal !== '#ffffff')
    .filter((literal) => !normalizer.toLowerCase().includes(literal))
    .sort();

  assert.deepEqual(uncovered, [], `Legacy neutral literals missing from runtime ownership: ${uncovered.join(', ')}`);
});

test('computed theme normalizer owns stylesheet colors without mutating Member previews', () => {
  assert.match(normalizer, /window\.getComputedStyle\(element\)/);
  assert.match(normalizer, /querySelectorAll<HTMLElement>\('\*'\)/);
  assert.match(normalizer, /style\.setProperty\(property, value, 'important'\)/);
  assert.match(normalizer, /\[data-preview-viewport\]/);
  assert.match(normalizer, /isNeutralTextContext/);
  assert.match(normalizer, /computed\.backgroundImage/);
});

test('modern token bridge cannot point canonical appearance surfaces back to modern aliases', () => {
  assert.doesNotMatch(bridge, /--color-surface\s*:\s*var\(--admin-modern-surface\)/);
  assert.doesNotMatch(bridge, /--color-surface-raised\s*:\s*var\(--admin-modern-surface-raised\)/);
});
