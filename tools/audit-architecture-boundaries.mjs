import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const API_SRC = join(ROOT, 'apps', 'api', 'src');
const MODULE_ROOT = join(API_SRC, 'modules');
const FRONTEND_ROOTS = [join(ROOT, 'apps', 'web-admin'), join(ROOT, 'apps', 'web-member')];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);
const SERVER_ONLY_IMPORTS = [
  /^@nestjs(?:\/|$)/,
  /^@prisma\/client(?:\/|$)/,
  /^node:(?:fs|child_process|cluster|net|tls|worker_threads)(?:\/|$)/,
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalize(path) {
  return relative(ROOT, path).split(sep).join('/');
}

function importsOf(source) {
  const imports = [];
  const pattern = /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(source))) imports.push(match[1]);
  return imports;
}

function moduleSlugFromPath(path) {
  const rel = relative(MODULE_ROOT, path).split(sep);
  return rel.length > 1 ? rel[0] : null;
}

function importedModuleSlug(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const target = resolve(dirname(fromFile), specifier);
  const rel = relative(MODULE_ROOT, target).split(sep);
  if (rel[0] === '..' || rel.length < 2) return null;
  return rel[0];
}

function findCycles(graph) {
  const cycles = [];
  const visited = new Set();
  const active = new Set();
  const stack = [];

  function visit(node) {
    if (active.has(node)) {
      const start = stack.indexOf(node);
      cycles.push([...stack.slice(start), node]);
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    active.add(node);
    stack.push(node);
    for (const next of graph.get(node) ?? []) visit(next);
    stack.pop();
    active.delete(node);
  }

  for (const node of graph.keys()) visit(node);
  return cycles;
}

const moduleFiles = (await walk(MODULE_ROOT)).filter((path) => path.endsWith('.module.ts'));
const graph = new Map();
for (const file of moduleFiles) {
  const owner = moduleSlugFromPath(file);
  if (!owner) continue;
  if (!graph.has(owner)) graph.set(owner, new Set());
  const source = await readFile(file, 'utf8');
  for (const specifier of importsOf(source)) {
    const dependency = importedModuleSlug(file, specifier);
    if (dependency && dependency !== owner) graph.get(owner).add(dependency);
  }
}

const cycles = findCycles(graph);
const frontendViolations = [];
for (const frontendRoot of FRONTEND_ROOTS) {
  for (const file of await walk(frontendRoot)) {
    const source = await readFile(file, 'utf8');
    for (const specifier of importsOf(source)) {
      const serverOnly = SERVER_ONLY_IMPORTS.some((pattern) => pattern.test(specifier));
      const apiSourceImport = specifier.includes('apps/api/') || specifier.includes('@platform/api/');
      if (serverOnly || apiSourceImport) frontendViolations.push({ file: normalize(file), specifier });
    }
  }
}

const appBoundaryViolations = [];
for (const appName of ['api', 'web-admin', 'web-member']) {
  const appRoot = join(ROOT, 'apps', appName);
  for (const file of await walk(appRoot)) {
    const source = await readFile(file, 'utf8');
    for (const specifier of importsOf(source)) {
      if (!specifier.startsWith('.')) continue;
      const target = resolve(dirname(file), specifier);
      const targetRel = relative(join(ROOT, 'apps'), target).split(sep);
      const targetApp = targetRel[0];
      if (targetApp && targetApp !== '..' && targetApp !== appName) {
        appBoundaryViolations.push({ file: normalize(file), specifier, targetApp });
      }
    }
  }
}

console.log(`Architecture boundary audit: ${graph.size} API module nodes`);
console.log(`  circular module dependencies: ${cycles.length}`);
console.log(`  frontend server-only imports: ${frontendViolations.length}`);
console.log(`  cross-app relative imports: ${appBoundaryViolations.length}`);

if (cycles.length) {
  console.error('\nCircular API module dependencies:');
  for (const cycle of cycles) console.error(`  - ${cycle.join(' -> ')}`);
}
if (frontendViolations.length) {
  console.error('\nFrontend files importing server-only code:');
  for (const item of frontendViolations) console.error(`  - ${item.file}: ${item.specifier}`);
}
if (appBoundaryViolations.length) {
  console.error('\nCross-app relative imports:');
  for (const item of appBoundaryViolations) console.error(`  - ${item.file}: ${item.specifier} -> ${item.targetApp}`);
}

if (cycles.length || frontendViolations.length || appBoundaryViolations.length) process.exitCode = 1;
