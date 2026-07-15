import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const scanRoots = ['apps', 'packages', 'tools'];
const sourceExtensions = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const cssExtensions = new Set(['.css', '.scss', '.sass']);
const skipDirs = new Set(['node_modules', '.next', 'dist', 'coverage', '.turbo']);


const retainedExportSymbols = new Map([
  [
    'packages/api-client/src/index.ts:ApiAuthTokenProvider',
    'Public API client type retained for consumers even when not referenced inside this monorepo.',
  ],
  [
    'packages/api-client/src/index.ts:ApiCacheMode',
    'Public API client type retained for consumers even when not referenced inside this monorepo.',
  ],
  [
    'packages/api-client/src/index.ts:ApiClientOptions',
    'Public API client type retained for consumers even when not referenced inside this monorepo.',
  ],
  [
    'packages/api-client/src/index.ts:ApiRequestOptions',
    'Public API client type retained for consumers even when not referenced inside this monorepo.',
  ],
]);

const retainedOrphanSources = new Map([
  [
    'apps/api/src/common/infrastructure/prisma-admin-ownership-repository.adapter.ts',
    'R-009 transaction-scoped ownership adapter retained for repository-boundary evidence and audit coverage.',
  ],
  [
    'apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts',
    'R-009 transaction-scoped finance adapters retained for repository-boundary evidence and audit coverage.',
  ],
  [
    'apps/api/src/modules/game-platform/adapters/real-provider-adapter.template.ts',
    'Provider integration template retained as documentation for future concrete adapters; it must not be registered directly.',
  ],
]);

const files = [];
for (const scanRoot of scanRoots) files.push(...await walk(join(root, scanRoot)));

const textByFile = new Map();
for (const file of files) textByFile.set(file, await readFile(join(root, file), 'utf8'));
const allText = [...textByFile.entries()].map(([file, text]) => `${file}\n${text}`).join('\n');

const sourceFiles = files.filter((file) => sourceExtensions.has(extname(file)));
const cssFiles = files.filter((file) => cssExtensions.has(extname(file)));
const tsxFiles = sourceFiles.filter((file) => file.endsWith('.tsx') || file.endsWith('.jsx'));

const orphanSourceCandidates = sourceFiles
  .filter((file) => !isEntrypoint(file) && !isFrameworkRouteFile(file) && !isTest(file) && !isReferencedByOtherSource(file))
  .sort();
const retainedOrphanSourceFindings = orphanSourceCandidates
  .filter((file) => retainedOrphanSources.has(file))
  .map((file) => ({ file, reason: retainedOrphanSources.get(file) }))
  .sort((a, b) => a.file.localeCompare(b.file));
const potentialOrphanSources = orphanSourceCandidates
  .filter((file) => !retainedOrphanSources.has(file))
  .sort();

const exportedSymbols = [];
for (const [file, text] of textByFile.entries()) {
  if (!sourceExtensions.has(extname(file))) continue;
  for (const match of text.matchAll(/export\s+(?:class|function|const|type|interface|enum)\s+([A-Za-z0-9_]+)/g)) {
    exportedSymbols.push({ file, symbol: match[1] });
  }
}

const unusedExportCandidates = exportedSymbols
  .filter(({ file, symbol }) => !isSymbolReferencedOutsideFile(file, symbol))
  .sort((a, b) => `${a.file}:${a.symbol}`.localeCompare(`${b.file}:${b.symbol}`));
const retainedExportFindings = unusedExportCandidates
  .filter(({ file, symbol }) => retainedExportSymbols.has(`${file}:${symbol}`))
  .map(({ file, symbol }) => ({ file, symbol, reason: retainedExportSymbols.get(`${file}:${symbol}`) }))
  .sort((a, b) => `${a.file}:${a.symbol}`.localeCompare(`${b.file}:${b.symbol}`));
const potentiallyUnusedExports = unusedExportCandidates
  .filter(({ file, symbol }) => !retainedExportSymbols.has(`${file}:${symbol}`))
  .sort((a, b) => `${a.file}:${a.symbol}`.localeCompare(`${b.file}:${b.symbol}`));

const componentFiles = tsxFiles
  .filter((file) => !isFrameworkRouteFile(file))
  .filter((file) => /(?:^|\/)(components?|ui|features?)\//.test(file) || /[A-Z][A-Za-z0-9]+\.tsx$/.test(file))
  .sort();
const potentiallyUnusedComponents = componentFiles
  .filter((file) => !isReferencedByOtherSource(file))
  .sort();

const routeFiles = sourceFiles
  .filter((file) => isFrameworkRouteFile(file) || /controller\.ts$/.test(file))
  .sort();

const featureFlags = [];
for (const [file, text] of textByFile.entries()) {
  if (!sourceExtensions.has(extname(file))) continue;
  for (const match of text.matchAll(/process\.env\.([A-Z0-9_]*(?:FEATURE|ENABLE|ENABLED|FLAG|EXPERIMENT)[A-Z0-9_]*)/g)) {
    featureFlags.push({ file, name: match[1] });
  }
}

const helperFiles = sourceFiles
  .filter((file) => /(?:helper|helpers|utils|util|formatter|mapper|normalizer|serializer|factory)\.(?:ts|tsx|mts|cts)$/.test(file))
  .sort();
const potentiallyUnusedHelpers = helperFiles
  .filter((file) => !isReferencedByOtherSource(file))
  .sort();

const cssInventory = cssFiles.map((file) => ({ file, referenced: isReferencedByOtherSource(file) })).sort((a, b) => a.file.localeCompare(b.file));

const report = {
  generatedAt: new Date().toISOString(),
  note: 'Candidate inventory only. Do not delete files from this report without owner review and regression evidence.',
  scanned: {
    roots: scanRoots,
    files: files.length,
    sourceFiles: sourceFiles.length,
    cssFiles: cssFiles.length,
  },
  counts: {
    potentialOrphanSources: potentialOrphanSources.length,
    retainedOrphanSources: retainedOrphanSourceFindings.length,
    potentiallyUnusedExports: potentiallyUnusedExports.length,
    retainedPublicExports: retainedExportFindings.length,
    componentFiles: componentFiles.length,
    potentiallyUnusedComponents: potentiallyUnusedComponents.length,
    routeFiles: routeFiles.length,
    featureFlags: new Set(featureFlags.map((item) => item.name)).size,
    helperFiles: helperFiles.length,
    potentiallyUnusedHelpers: potentiallyUnusedHelpers.length,
    cssFiles: cssInventory.length,
    potentiallyUnreferencedCssFiles: cssInventory.filter((item) => !item.referenced).length,
  },
  potentialOrphanSources: potentialOrphanSources.slice(0, 200),
  retainedOrphanSources: retainedOrphanSourceFindings,
  potentiallyUnusedExports: potentiallyUnusedExports.slice(0, 300),
  retainedPublicExports: retainedExportFindings,
  potentiallyUnusedComponents: potentiallyUnusedComponents.slice(0, 200),
  routes: routeFiles,
  featureFlags: [...new Map(featureFlags.map((item) => [item.name, item])).values()].sort((a, b) => a.name.localeCompare(b.name)),
  potentiallyUnusedHelpers: potentiallyUnusedHelpers.slice(0, 200),
  cssInventory,
};

const output = process.env.R014_CLEANUP_INVENTORY_OUTPUT ?? 'docs/evidence/r014-cleanup-inventory.json';
await writeFile(join(root, output), `${JSON.stringify(report, null, 2)}\n`);

console.log('R-014 cleanup inventory');
console.log(`  files scanned: ${report.scanned.files}`);
for (const [key, value] of Object.entries(report.counts)) console.log(`  ${key}: ${value}`);
console.log(`  evidence: ${output}`);

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (skipDirs.has(entry.name)) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(fullPath));
    else if (entry.isFile() && (sourceExtensions.has(extname(entry.name)) || cssExtensions.has(extname(entry.name)))) {
      result.push(normalize(fullPath));
    }
  }
  return result;
}

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

function normalize(path) {
  return relative(root, path).split(sep).join('/');
}

function isTest(file) {
  return /\.(spec|test)\.(?:tsx?|jsx?|mts|cts|mjs|cjs)$/.test(file) || file.includes('/__tests__/');
}

function isEntrypoint(file) {
  return /(?:^|\/)(main|index|app|module)\.(?:tsx?|jsx?|mts|cts|mjs|cjs)$/.test(file)
    || file.endsWith('.module.ts')
    || file.endsWith('.d.ts')
    || /^tools\/[^/]+\.(?:mjs|cjs|js|ts)$/.test(file)
    || /(?:^|\/)(?:next|jest|playwright|vitest|tailwind|postcss|eslint)\.config\.(?:mjs|cjs|js|ts)$/.test(file);
}

function isFrameworkRouteFile(file) {
  return /\/(?:app|pages)\/(?:.+\/)?(?:page|route|layout|loading|error|not-found|template)\.tsx?$/.test(file)
    || /\/pages\/.+\.tsx?$/.test(file);
}

function isReferencedByOtherSource(file) {
  const base = file.replace(/\.(tsx?|jsx?|mts|cts|mjs|cjs|css|scss|sass)$/, '');
  const basename = base.split('/').at(-1);
  const importSpec = base.startsWith('apps/') || base.startsWith('packages/') || base.startsWith('tools/') ? base : `./${base}`;
  const importSpecs = [importSpec];
  if (cssExtensions.has(extname(file))) importSpecs.push(file, `./${file}`);
  for (const [otherFile, text] of textByFile.entries()) {
    if (otherFile === file || !sourceExtensions.has(extname(otherFile))) continue;
    const relativeSpec = relativeImportSpecifier(otherFile, base);
    const relativeSpecs = [relativeSpec];
    if (cssExtensions.has(extname(file))) relativeSpecs.push(`${relativeSpec}${extname(file)}`);
    if (relativeSpecs.some((spec) => text.includes(`'${spec}'`) || text.includes(`"${spec}"`))) return true;
    if (importSpecs.some((spec) => text.includes(`'${spec}'`) || text.includes(`"${spec}"`))) return true;
    if (basename && text.includes(`from './${basename}'`)) return true;
    if (cssExtensions.has(extname(file)) && text.includes(`'./${basename}${extname(file)}'`)) return true;
    if (cssExtensions.has(extname(file)) && text.includes(`"./${basename}${extname(file)}"`)) return true;
  }
  return false;
}

function relativeImportSpecifier(fromFile, targetBase) {
  const fromDir = dirname(fromFile);
  let spec = relative(fromDir, targetBase).split(sep).join('/');
  if (!spec.startsWith('.')) spec = `./${spec}`;
  return spec;
}

function isSymbolReferencedOutsideFile(file, symbol) {
  const pattern = new RegExp(`\\b${escapeRegExp(symbol)}\\b`, 'g');
  for (const [otherFile, text] of textByFile.entries()) {
    if (otherFile === file || !sourceExtensions.has(extname(otherFile))) continue;
    if (pattern.test(text)) return true;
    pattern.lastIndex = 0;
  }
  return false;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
