import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appDir = path.join(process.cwd(), 'app');
const ignored = new Set([
  'admin-appearance-foundation.css',
  'admin-theme-completeness.css',
  'admin-legacy-theme-normalizer.tsx',
  'admin-theme-literal-audit.spec.ts',
]);

const neutralLiterals = [
  '#070b12', '#080808', '#080b0f', '#0b1220', '#0c1420', '#0f172a', '#102036',
  '#11161d', '#111827', '#111c2a', '#172033', '#172437', '#181818', '#181f28', '#1e293b', '#202936',
  '#334155', '#475569', '#64748b', '#8a98aa', '#94a3b8', '#9ca3af', '#9caac0', '#c9d3e0', '#cbd5e1',
  '#dfe6ef', '#e2e8f0', '#f3f6fb', '#f7f9fc', '#fff', '#ffffff',
];

const literalPattern = new RegExp(neutralLiterals.map((value) => value.replace('#', '#')).join('|'), 'i');
const declarationPattern = /\b(background(?:-color)?|color|border(?:-(?:top|right|bottom|left))?(?:-color)?)\s*:\s*([^;]+)/i;

function walk(dir: string, out: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (/\.(css|tsx?)$/.test(entry) && !entry.endsWith('.spec.ts') && !entry.endsWith('.spec.tsx')) out.push(full);
  }
  return out;
}

test('Admin theme has no unowned neutral color literals outside appearance authorities', () => {
  const offenders: string[] = [];
  for (const file of walk(appDir)) {
    if (ignored.has(path.basename(file))) continue;
    const source = readFileSync(file, 'utf8');
    const lines = source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? '';
      if (!literalPattern.test(line)) continue;
      if (file.endsWith('.css')) {
        const declaration = line.match(declarationPattern);
        if (!declaration || !literalPattern.test(declaration[2] ?? '')) continue;
      } else if (!/(background(?:Color)?|color|border(?:Color)?)[\s:'\"]/.test(line)) {
        continue;
      }
      offenders.push(`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
    }
  }

  assert.equal(
    offenders.length,
    0,
    `Found ${offenders.length} hard-coded neutral theme declarations outside the appearance authorities:\n${offenders.slice(0, 240).join('\n')}`,
  );
});
