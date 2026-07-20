import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const FRONTENDS = [
  join(ROOT, 'apps', 'web-admin'),
  join(ROOT, 'apps', 'web-member'),
];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORED_DIRECTORIES = new Set(['node_modules', '.next', 'dist', 'coverage']);
const SHARED_PACKAGE = '@platform/api-client';
const FORBIDDEN_DECLARATIONS = [
  'ApiClientError',
  'createApiClient',
  'joinApiUrl',
  'mergeHeaders',
  'readResponseBody',
];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalizePath(path) {
  return relative(ROOT, path).split(sep).join('/');
}

const violations = [];
const dependencyChecks = [];

for (const frontend of FRONTENDS) {
  const packagePath = join(frontend, 'package.json');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  const hasSharedDependency = packageJson.dependencies?.[SHARED_PACKAGE] === 'workspace:*';
  dependencyChecks.push({ app: packageJson.name, hasSharedDependency });
  if (!hasSharedDependency) {
    violations.push({ file: normalizePath(packagePath), reason: `missing ${SHARED_PACKAGE} workspace dependency` });
  }

  for (const file of await walk(frontend)) {
    const source = await readFile(file, 'utf8');
    for (const name of FORBIDDEN_DECLARATIONS) {
      const declaration = new RegExp(`(?:class|function|interface|type|const|let|var)\\s+${name}\\b`);
      if (declaration.test(source)) {
        violations.push({ file: normalizePath(file), reason: `redeclares shared API primitive ${name}` });
      }
    }
  }
}

console.log(`Frontend API client boundary: ${violations.length === 0 ? 'valid' : 'invalid'}`);
for (const check of dependencyChecks) {
  console.log(`  ${check.app}: ${check.hasSharedDependency ? 'uses' : 'missing'} ${SHARED_PACKAGE}`);
}
for (const violation of violations) console.error(`  - ${violation.file}: ${violation.reason}`);

if (violations.length > 0) process.exitCode = 1;
