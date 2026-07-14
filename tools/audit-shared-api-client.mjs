import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const APP_ROOTS = [join(ROOT, 'apps', 'web-admin'), join(ROOT, 'apps', 'web-member')];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'coverage']);
const SHARED_IMPORT = /from\s+['"]@platform\/api-client['"]|require\(['"]@platform\/api-client['"]\)/;
const DIRECT_API_FETCH = /\bfetch\s*\(\s*(?:`[^`]*(?:NEXT_PUBLIC_API_URL|\/admin\/|\/member\/|\/public\/|\/provider-webhooks\/)[^`]*`|['"][^'"]*(?:\/admin\/|\/member\/|\/provider-webhooks\/)[^'"]*['"])/;
const DUPLICATE_HELPER = /\b(?:function|const)\s+(adminFetch|memberFetch|fetchJson|apiFetch)\b/;

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalize(path) {
  return relative(ROOT, path).split(sep).join('/');
}

const violations = [];
let sharedImports = 0;
let scanned = 0;
for (const root of APP_ROOTS) {
  for (const file of await walk(root)) {
    scanned += 1;
    const source = await readFile(file, 'utf8');
    if (SHARED_IMPORT.test(source)) sharedImports += 1;
    if (DIRECT_API_FETCH.test(source) && !SHARED_IMPORT.test(source)) {
      violations.push(`${normalize(file)}: direct platform API fetch without @platform/api-client`);
    }
    const helper = source.match(DUPLICATE_HELPER);
    if (helper) violations.push(`${normalize(file)}: duplicate helper ${helper[1]}`);
  }
}

console.log(`Shared API client audit: ${scanned} frontend source files`);
console.log(`  files importing @platform/api-client: ${sharedImports}`);
console.log(`  violations: ${violations.length}`);

if (sharedImports === 0) violations.push('No frontend file imports @platform/api-client');
if (violations.length) {
  console.error('\nShared API client ownership violations:');
  for (const violation of violations) console.error(`  - ${violation}`);
  process.exitCode = 1;
}
