import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', '.next', 'node_modules', 'dist', 'coverage', '.turbo']);
const generatedExtensions = new Set(['.log', '.tmp', '.cache']);
const candidates = [];
const jsonMode = process.argv.includes('--json');

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

function normalize(path) {
  return relative(root, path).split(sep).join('/');
}

const files = await walk(root);
const searchableFiles = files.filter((file) => {
  const extension = extname(file);
  return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.yml', '.yaml', '.sh'].includes(extension);
});
const contents = new Map();
for (const file of searchableFiles) {
  try { contents.set(file, await readFile(file, 'utf8')); } catch { /* binary or unreadable */ }
}

for (const file of files) {
  const path = normalize(file);
  const extension = extname(file);
  if (path.startsWith('prisma/migrations/')) continue;
  if (path.startsWith('docs/') || path.startsWith('.github/')) continue;

  const basename = path.split('/').at(-1);
  const reasons = [];
  if (generatedExtensions.has(extension)) reasons.push('generated artifact extension');
  if (/\.(?:bak|backup|old|orig|rej)$/i.test(path)) reasons.push('backup or rejected patch file');
  if (/(?:^|\/)(?:copy|temp|tmp|unused|deprecated)[-_]/i.test(path)) reasons.push('suspicious temporary or deprecated name');

  if (reasons.length === 0 || !basename) continue;
  const references = [];
  for (const [otherFile, source] of contents) {
    if (otherFile === file) continue;
    if (source.includes(basename) || source.includes(path)) references.push(normalize(otherFile));
    if (references.length >= 10) break;
  }
  candidates.push({ path, reasons, references });
}

const report = {
  generatedAt: new Date().toISOString(),
  scannedFiles: files.length,
  candidateCount: candidates.length,
  candidates,
};

if (jsonMode) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Repository files scanned: ${files.length}`);
  console.log(`Cleanup review candidates: ${candidates.length}`);
  for (const candidate of candidates) {
    console.log(`- ${candidate.path}: ${candidate.reasons.join(', ')}`);
    if (candidate.references.length) console.log(`  references: ${candidate.references.join(', ')}`);
  }
}

// Inventory only. Deletion requires human review and the cleanup policy evidence gate.
