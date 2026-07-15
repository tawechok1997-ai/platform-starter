import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const API_SRC = join(ROOT, 'apps', 'api', 'src');
const MODULE_ROOT = join(API_SRC, 'modules');
const FRONTEND_ROOTS = [join(ROOT, 'apps', 'web-admin'), join(ROOT, 'apps', 'web-member')];
const EXCEPTION_REGISTRY = join(ROOT, 'docs', 'architecture', 'boundary-exceptions.md');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);
const SERVER_ONLY_IMPORTS = [
  /^@nestjs(?:\/|$)/,
  /^@prisma\/client(?:\/|$)/,
  /^node:(?:fs|child_process|cluster|net|tls|worker_threads)(?:\/|$)/,
];
const DOMAIN_FORBIDDEN_IMPORTS = [/^@nestjs(?:\/|$)/, /^@prisma\/client(?:\/|$)/];
const PRIVATE_CROSS_MODULE_SEGMENTS = /\/(?:controllers?|dto|repositories?|prisma|internal)(?:\/|$)|\.(?:controller|dto|repository)\b/;
const TEST_FILE_PATTERN = /(?:^|\/)[^/]+\.(?:spec|test)\.(?:ts|tsx|mts|cts)$/;

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

function isTestFile(path) {
  return TEST_FILE_PATTERN.test(normalize(path));
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

function isDomainOrPolicyFile(path) {
  const normalized = normalize(path);
  return normalized.includes('/domain/') || normalized.includes('/policies/') || /\.(?:policy|entity|value-object)\.ts$/.test(normalized);
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

function activeExceptions(markdown) {
  const rows = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('| ID |')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 7 || !cells[0]) continue;
    rows.push({ id: cells[0], caller: cells[1], callee: cells[2], owner: cells[3], reason: cells[4], target: cells[5], expires: cells[6], expired: cells[6] < today });
  }
  return rows;
}

const allApiFiles = await walk(API_SRC);
const moduleFiles = allApiFiles.filter((path) => path.endsWith('.module.ts'));
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
    if (isTestFile(file)) continue;
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

const domainViolations = [];
const deepImportViolations = [];
for (const file of allApiFiles) {
  const source = await readFile(file, 'utf8');
  const owner = moduleSlugFromPath(file);
  for (const specifier of importsOf(source)) {
    if (isDomainOrPolicyFile(file) && DOMAIN_FORBIDDEN_IMPORTS.some((pattern) => pattern.test(specifier))) {
      domainViolations.push({ file: normalize(file), specifier });
    }
    const dependency = importedModuleSlug(file, specifier);
    if (owner && dependency && dependency !== owner && PRIVATE_CROSS_MODULE_SEGMENTS.test(specifier.replaceAll('\\', '/'))) {
      deepImportViolations.push({ file: normalize(file), specifier, owner, dependency });
    }
  }
}

const registry = await readFile(EXCEPTION_REGISTRY, 'utf8');
const exceptions = activeExceptions(registry);
const invalidExceptions = exceptions.filter((item) => item.expired || !item.owner || !item.reason || !item.target || !/^\d{4}-\d{2}-\d{2}$/.test(item.expires));

console.log(`Architecture boundary audit: ${graph.size} API module nodes`);
console.log(`  circular module dependencies: ${cycles.length}`);
console.log(`  frontend server-only imports: ${frontendViolations.length}`);
console.log(`  cross-app relative imports: ${appBoundaryViolations.length}`);
console.log(`  domain/policy framework imports: ${domainViolations.length}`);
console.log(`  private cross-module deep imports: ${deepImportViolations.length}`);
console.log(`  invalid/expired exceptions: ${invalidExceptions.length}`);

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
if (domainViolations.length) {
  console.error('\nDomain/policy files importing framework or Prisma implementation code:');
  for (const item of domainViolations) console.error(`  - ${item.file}: ${item.specifier}`);
}
if (deepImportViolations.length) {
  console.error('\nPrivate cross-module deep imports:');
  for (const item of deepImportViolations) console.error(`  - ${item.file}: ${item.owner} -> ${item.dependency} via ${item.specifier}`);
}
if (invalidExceptions.length) {
  console.error('\nInvalid or expired boundary exceptions:');
  for (const item of invalidExceptions) console.error(`  - ${item.id}: owner=${item.owner || 'missing'} expires=${item.expires || 'missing'}`);
}

if (cycles.length || frontendViolations.length || appBoundaryViolations.length || domainViolations.length || deepImportViolations.length || invalidExceptions.length) process.exitCode = 1;
