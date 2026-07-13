import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'apps', 'web-admin', 'app');
const allowedInnerHtml = new Set(['(auth)/anti-bot-widget.tsx']);
const forbidden = [
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
  ['eval', /\beval\s*\(/],
  ['document.write', /document\.write\s*\(/],
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
  return files;
}

let failed = false;
for (const file of await walk(ROOT)) {
  const source = await readFile(file, 'utf8');
  const relative = file.slice(ROOT.length + 1).split('\\').join('/');
  for (const [label, pattern] of forbidden) {
    if (pattern.test(source)) {
      failed = true;
      console.error(`[FAIL] ${label} sink in apps/web-admin/app/${relative}`);
    }
  }
  if (source.includes('innerHTML') && !allowedInnerHtml.has(relative)) {
    failed = true;
    console.error(`[FAIL] raw innerHTML usage in apps/web-admin/app/${relative}`);
  }
}
if (failed) process.exitCode = 1;
else console.log('[PASS] no unsafe Admin UI HTML sinks');
