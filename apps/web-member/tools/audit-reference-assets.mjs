import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'public/assets/reference-brand');
const allowedExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.json', '.md']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const files = await walk(root);
const issues = [];
const hashes = new Map();

for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  const extension = path.extname(file).toLowerCase();
  const metadata = await stat(file);

  if (!allowedExtensions.has(extension)) issues.push(`unsupported extension: ${relative}`);
  if (metadata.size === 0) issues.push(`empty file: ${relative}`);
  if (metadata.size > 4 * 1024 * 1024) issues.push(`oversized asset (>4 MiB): ${relative}`);

  const bytes = await readFile(file);
  const hash = createHash('sha256').update(bytes).digest('hex');
  const duplicate = hashes.get(hash);
  if (duplicate) issues.push(`duplicate content: ${relative} == ${duplicate}`);
  else hashes.set(hash, relative);

  if (extension === '.svg') {
    const source = bytes.toString('utf8');
    if (/<script|\son\w+\s*=|javascript:|data:text\/html/i.test(source)) {
      issues.push(`unsafe SVG content: ${relative}`);
    }
  }
}

console.log(`Reference asset audit: ${files.length} files checked`);
if (issues.length) {
  for (const issue of issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log('Reference assets passed integrity checks.');
}
