import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const appModulePath = join(root, 'apps', 'api', 'src', 'app.module.ts');
const moduleMapPath = join(root, 'docs', 'architecture', 'module-map.md');
const dependencyMapPath = join(root, 'docs', 'architecture', 'dependency-map.md');
const routeOwnershipPath = join(root, 'docs', 'architecture', 'route-ownership.md');

const [appModule, moduleMap, dependencyMap, routeOwnership] = await Promise.all([
  readFile(appModulePath, 'utf8'),
  readFile(moduleMapPath, 'utf8'),
  readFile(dependencyMapPath, 'utf8'),
  readFile(routeOwnershipPath, 'utf8'),
]);

const moduleSlugs = [...appModule.matchAll(/from ['"]\.\/modules\/([^/]+)\//g)]
  .map((match) => match[1])
  .filter((value, index, values) => values.indexOf(value) === index)
  .sort();

const undocumentedModules = moduleSlugs.filter((slug) => !moduleMap.includes(`| ${slug} |`));
const requiredDependencySections = ['## Intended direction', '## Approved cross-module relationships', '## Prohibited relationships'];
const missingDependencySections = requiredDependencySections.filter((heading) => !dependencyMap.includes(heading));
const requiredRouteColumns = ['Route family', 'Owning module', 'Permission / actor', 'Critical side effects'];
const missingRouteColumns = requiredRouteColumns.filter((column) => !routeOwnership.includes(column));

console.log(`Architecture inventory audit: ${moduleSlugs.length} registered API modules`);
console.log(`  undocumented modules: ${undocumentedModules.length}`);
console.log(`  missing dependency sections: ${missingDependencySections.length}`);
console.log(`  missing route ownership columns: ${missingRouteColumns.length}`);

if (undocumentedModules.length) {
  console.error('\nModules registered in AppModule but missing from module-map.md:');
  for (const slug of undocumentedModules) console.error(`  - ${slug}`);
}
if (missingDependencySections.length) {
  console.error('\nRequired dependency-map.md sections are missing:');
  for (const heading of missingDependencySections) console.error(`  - ${heading}`);
}
if (missingRouteColumns.length) {
  console.error('\nRequired route-ownership.md columns are missing:');
  for (const column of missingRouteColumns) console.error(`  - ${column}`);
}

if (undocumentedModules.length || missingDependencySections.length || missingRouteColumns.length) {
  process.exitCode = 1;
}
