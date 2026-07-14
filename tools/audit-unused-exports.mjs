import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const packageRoot = join(root, 'packages');
const sourceExtensions = new Set(['.ts', '.tsx', '.mts', '.cts']);
const failures = [];

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['node_modules', 'dist', 'coverage'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && sourceExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalized(path) {
  return relative(root, path).split(sep).join('/');
}

const packageDirs = (await readdir(packageRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packageRoot, entry.name));

let checkedPackages = 0;
let checkedEntrypoints = 0;
for (const directory of packageDirs) {
  const packageJsonPath = join(directory, 'package.json');
  if (!await exists(packageJsonPath)) continue;
  checkedPackages += 1;
  const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  const entry = pkg.types ?? pkg.main;
  if (!entry || !String(entry).startsWith('src/')) continue;
  checkedEntrypoints += 1;
  const entryPath = join(directory, entry);
  if (!await exists(entryPath)) {
    failures.push(`${normalized(packageJsonPath)}: entrypoint ${entry} does not exist`);
    continue;
  }

  const source = await readFile(entryPath, 'utf8');
  const files = await walk(join(directory, 'src'));
  const localModules = new Set(files.map((file) => normalized(file)));
  const reexports = [...source.matchAll(/export\s+(?:\*|\{[^}]+\})\s+from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
  for (const specifier of reexports) {
    if (!specifier.startsWith('.')) continue;
    const base = join(directory, 'src', specifier.replace(/^\.\//, ''));
    const candidates = [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].map(normalized);
    if (!candidates.some((candidate) => localModules.has(candidate))) {
      failures.push(`${normalized(entryPath)}: re-export target ${specifier} cannot be resolved`);
    }
  }

  if (!/\bexport\b/.test(source)) failures.push(`${normalized(entryPath)}: public package entrypoint exports nothing`);
}

console.log('Unused/package export audit:');
console.log(`  packages checked: ${checkedPackages}`);
console.log(`  public entrypoints checked: ${checkedEntrypoints}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nPackage export violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
