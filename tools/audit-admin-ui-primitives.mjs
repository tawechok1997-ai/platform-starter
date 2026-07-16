import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const adminRoot = path.join(root, 'apps', 'web-admin', 'app');
const allowedExtensions = new Set(['.ts', '.tsx']);
const ignoredNames = new Set(['admin-ui.tsx']);

const findings = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await walk(absolutePath);
      continue;
    }

    if (!allowedExtensions.has(path.extname(entry.name)) || ignoredNames.has(entry.name)) continue;

    const source = await readFile(absolutePath, 'utf8');
    const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, '/');
    const lines = source.split(/\r?\n/);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (/^<button\b/.test(trimmed) || /<button\b/.test(trimmed)) {
        findings.push({ kind: 'raw-button', file: relativePath, line: index + 1, sample: trimmed.slice(0, 160) });
      }
      if (/^<section\b/.test(trimmed) || /<section\b/.test(trimmed)) {
        findings.push({ kind: 'raw-surface', file: relativePath, line: index + 1, sample: trimmed.slice(0, 160) });
      }
      if (/role=["']alert["']/.test(trimmed)) {
        findings.push({ kind: 'raw-notice', file: relativePath, line: index + 1, sample: trimmed.slice(0, 160) });
      }
    });
  }
}

await walk(adminRoot);

const grouped = findings.reduce((acc, finding) => {
  acc[finding.kind] ??= [];
  acc[finding.kind].push(finding);
  return acc;
}, {});

console.log('Admin UI primitive migration inventory');
console.log(`Scanned: ${path.relative(root, adminRoot)}`);
console.log(`Findings: ${findings.length}`);

for (const kind of ['raw-button', 'raw-surface', 'raw-notice']) {
  const items = grouped[kind] ?? [];
  console.log(`\n${kind}: ${items.length}`);
  for (const item of items.slice(0, 50)) {
    console.log(`- ${item.file}:${item.line} ${item.sample}`);
  }
  if (items.length > 50) console.log(`- ... ${items.length - 50} more`);
}

const strict = process.argv.includes('--strict');
if (strict && findings.length > 0) {
  console.error('\nStrict mode failed: raw Admin UI primitives remain. Migrate them through apps/web-admin/app/components/admin-ui.tsx.');
  process.exitCode = 1;
}
