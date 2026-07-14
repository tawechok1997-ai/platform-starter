import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const SOURCE_ROOTS = ['apps', 'packages'].map((path) => join(ROOT, path));
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
const IGNORED = new Set(['node_modules', '.next', 'dist', 'coverage', 'generated']);

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && EXTENSIONS.includes(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalize(path) {
  return relative(ROOT, path).split(sep).join('/');
}

function importsOf(source) {
  const imports = [];
  const patterns = [
    /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) imports.push(match[1]);
  }
  return imports;
}

async function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), specifier);
  const candidates = [
    base,
    ...EXTENSIONS.map((extension) => `${base}${extension}`),
    ...EXTENSIONS.map((extension) => join(base, `index${extension}`)),
  ];
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  return null;
}

const files = (await Promise.all(SOURCE_ROOTS.map(walk))).flat();
const fileSet = new Set(files);
const graph = new Map(files.map((file) => [file, []]));

for (const file of files) {
  const source = await readFile(file, 'utf8');
  for (const specifier of importsOf(source)) {
    const target = await resolveImport(file, specifier);
    if (target && fileSet.has(target)) graph.get(file).push(target);
  }
}

const visiting = new Set();
const visited = new Set();
const stack = [];
const cycles = new Map();

function canonicalCycle(cycle) {
  const nodes = cycle.slice(0, -1).map(normalize);
  const rotations = nodes.map((_, index) => [...nodes.slice(index), ...nodes.slice(0, index)]);
  rotations.sort((a, b) => a.join(' -> ').localeCompare(b.join(' -> ')));
  return `${rotations[0].join(' -> ')} -> ${rotations[0][0]}`;
}

function visit(file) {
  if (visited.has(file)) return;
  if (visiting.has(file)) {
    const start = stack.indexOf(file);
    const cycle = [...stack.slice(start), file];
    cycles.set(canonicalCycle(cycle), cycle);
    return;
  }
  visiting.add(file);
  stack.push(file);
  for (const target of graph.get(file) ?? []) visit(target);
  stack.pop();
  visiting.delete(file);
  visited.add(file);
}

for (const file of files) visit(file);

console.log(`Circular dependency audit: ${files.length} source files, ${cycles.size} cycles`);
if (cycles.size) {
  console.error('\nCircular dependency violations:');
  for (const key of [...cycles.keys()].sort()) console.error(`  - ${key}`);
  process.exitCode = 1;
}
