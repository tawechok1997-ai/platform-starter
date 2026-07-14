import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const ROOT = process.cwd();
const API_SRC = join(ROOT, 'apps', 'api', 'src');
const MODULE_ROOT = join(API_SRC, 'modules');
const APP_MODULE = join(API_SRC, 'app.module.ts');
const DOCS = {
  moduleMap: join(ROOT, 'docs', 'architecture', 'module-map.md'),
  dependencyMap: join(ROOT, 'docs', 'architecture', 'dependency-map.md'),
  routeOwnership: join(ROOT, 'docs', 'architecture', 'route-ownership.md'),
};
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalize(path) { return relative(ROOT, path).split(sep).join('/'); }
function moduleSlug(path) {
  const parts = relative(MODULE_ROOT, path).split(sep);
  return parts[0] && parts[0] !== '..' ? parts[0] : null;
}
function importsOf(source) {
  return [...source.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g)].map((match) => match[1]);
}
function controllerPrefixes(source) {
  return [...source.matchAll(/@Controller\(\s*(['"`])([^'"`]*)\1\s*\)/g)].map((match) => match[2] || '/');
}
function routeCount(source) {
  return [...source.matchAll(/@(Get|Post|Put|Patch|Delete|Options|Head|All)\s*\(/g)].length;
}
function tableModules(markdown) {
  return new Set([...markdown.matchAll(/^\|\s*([a-z0-9-]+)\s*\|/gim)].map((match) => match[1]));
}
function routeOwnerModules(markdown) {
  return new Set([...markdown.matchAll(/^\|[^\n|]+\|\s*([a-z0-9-]+)\s*\|/gim)].map((match) => match[1]));
}
function resolveImportedModule(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const target = resolve(dirname(fromFile), specifier);
  const parts = relative(MODULE_ROOT, target).split(sep);
  return parts[0] && parts[0] !== '..' ? parts[0] : null;
}

const [appModule, moduleMap, dependencyMap, routeOwnership] = await Promise.all([
  readFile(APP_MODULE, 'utf8'),
  readFile(DOCS.moduleMap, 'utf8'),
  readFile(DOCS.dependencyMap, 'utf8'),
  readFile(DOCS.routeOwnership, 'utf8'),
]);
const files = await walk(MODULE_ROOT);
const registeredModules = [...appModule.matchAll(/from ['"]\.\/modules\/([^/]+)\//g)]
  .map((match) => match[1])
  .filter((value, index, values) => values.indexOf(value) === index)
  .sort();
const documentedModules = tableModules(moduleMap);
const documentedRouteOwners = routeOwnerModules(routeOwnership);
const undocumentedModules = registeredModules.filter((slug) => !documentedModules.has(slug));

const controllers = [];
const jobs = [];
const crossModuleImports = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const owner = moduleSlug(file);
  if (!owner) continue;

  if (file.endsWith('.controller.ts')) {
    const prefixes = controllerPrefixes(source);
    controllers.push({ file: normalize(file), owner, prefixes, routes: routeCount(source) });
  }
  if (/@(?:Cron|Interval|Timeout|Processor|Process)\s*\(/.test(source)) {
    jobs.push({ file: normalize(file), owner });
  }
  for (const specifier of importsOf(source)) {
    const targetOwner = resolveImportedModule(file, specifier);
    if (targetOwner && targetOwner !== owner) crossModuleImports.push({ from: owner, to: targetOwner, file: normalize(file), specifier });
  }
}

const controllerOwnersMissingFromMap = [...new Set(controllers.map((item) => item.owner))].filter((slug) => !documentedModules.has(slug));
const controllerOwnersMissingFromRoutes = [...new Set(controllers.map((item) => item.owner))].filter((slug) => !documentedRouteOwners.has(slug));
const emptyControllers = controllers.filter((item) => item.prefixes.length === 0 || item.routes === 0);
const undocumentedJobs = jobs.filter((item) => !dependencyMap.includes(`| ${item.owner} |`) && !moduleMap.includes(`| ${item.owner} |`));
const undocumentedCrossModule = crossModuleImports.filter((item) => {
  const relationship = `${item.from} -> ${item.to}`;
  const slashRelationship = `${item.from} / ${item.to}`;
  return !dependencyMap.includes(relationship) && !dependencyMap.includes(slashRelationship) && !dependencyMap.includes(`| ${item.from} | ${item.to} |`);
});

const requiredDependencySections = [
  '## Intended direction',
  '## Approved cross-module relationships',
  '## Background jobs and schedulers',
  '## Public module contracts',
  '## Prohibited relationships',
];
const requiredRouteColumns = ['Route family', 'Owning module', 'Permission / actor', 'Data / tables', 'Critical side effects', 'Audit event'];
const missingDependencySections = requiredDependencySections.filter((heading) => !dependencyMap.includes(heading));
const missingRouteColumns = requiredRouteColumns.filter((column) => !routeOwnership.includes(column));

console.log(`Architecture inventory audit: ${registeredModules.length} registered modules, ${controllers.length} controllers, ${jobs.length} jobs`);
console.log(`  undocumented registered modules: ${undocumentedModules.length}`);
console.log(`  controller owners missing from module map: ${controllerOwnersMissingFromMap.length}`);
console.log(`  controller owners missing from route ownership: ${controllerOwnersMissingFromRoutes.length}`);
console.log(`  controllers without detectable prefix/routes: ${emptyControllers.length}`);
console.log(`  undocumented jobs: ${undocumentedJobs.length}`);
console.log(`  undocumented cross-module imports: ${undocumentedCrossModule.length}`);
console.log(`  missing dependency sections: ${missingDependencySections.length}`);
console.log(`  missing route columns: ${missingRouteColumns.length}`);

function report(title, items, formatter = (item) => String(item)) {
  if (!items.length) return;
  console.error(`\n${title}:`);
  for (const item of items) console.error(`  - ${formatter(item)}`);
}
report('Registered modules missing from module-map.md', undocumentedModules);
report('Controller owners missing from module-map.md', controllerOwnersMissingFromMap);
report('Controller owners missing from route-ownership.md', controllerOwnersMissingFromRoutes);
report('Controllers without detectable @Controller prefix or HTTP handlers', emptyControllers, (item) => `${item.file} prefixes=${item.prefixes.length} routes=${item.routes}`);
report('Background jobs missing from architecture docs', undocumentedJobs, (item) => `${item.file} (${item.owner})`);
report('Cross-module imports missing from dependency-map.md', undocumentedCrossModule, (item) => `${item.file}: ${item.from} -> ${item.to} via ${item.specifier}`);
report('Required dependency-map.md sections missing', missingDependencySections);
report('Required route-ownership.md columns missing', missingRouteColumns);

const failureCount = undocumentedModules.length
  + controllerOwnersMissingFromMap.length
  + controllerOwnersMissingFromRoutes.length
  + emptyControllers.length
  + undocumentedJobs.length
  + undocumentedCrossModule.length
  + missingDependencySections.length
  + missingRouteColumns.length;
if (failureCount) process.exitCode = 1;
