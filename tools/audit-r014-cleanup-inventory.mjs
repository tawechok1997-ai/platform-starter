import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const scanRoots = ['apps', 'packages', 'tools'];
const sourceExtensions = new Set(['.ts', '.tsx', '.mts', '.cts']);
const cssExtensions = new Set(['.css', '.scss', '.sass']);
const skipDirs = new Set(['node_modules', '.next', 'dist', 'coverage', '.turbo']);

const files = [];
for (const scanRoot of scanRoots) files.push(...await walk(join(root, scanRoot)));

const textByFile = new Map();
for (const file of files) textByFile.set(file, await readFile(join(root, file), 'utf8'));
const allText = [...textByFile.entries()].map(([file, text]) => `${file}\n${text}`).join('\n');

const sourceFiles = files.filter((file) => sourceExtensions.has(extname(file)));
const cssFiles = files.filter((file) => cssExtensions.has(extname(file)));
const tsxFiles = sourceFiles.filter((file) => file.endsWith('.tsx'));

const potentialOrphanSources = sourceFiles
  .filter((file) => !isEntrypoint(file) && !isTest(file) && !isReferencedByOtherSource(file))
  .sort();

const exportedSymbols = [];
for (const [file, text] of textByFile.entries()) {
  if (!sourceExtensions.has(extname(file))) continue;
  for (const match of text.matchAll(/export\s+(?:class|function|const|type|interface|enum)\s+([A-Za-z0-9_]+)/g)) {
    exportedSymbols.push({ file, symbol: match[1] });
  }
}

const potentiallyUnusedExports = exportedSymbols
  .filter(({ file, symbol }) => !isSymbolReferencedOutsideFile(file, symbol))
  .sort((a, b) => `${a.file}:${a.symbol}`.localeCompare(`${b.file}:${b.symbol}`));

const componentFiles = tsxFiles
  .filter((file) => /(?:^|\/)(components?|ui|features?)\//.test(file) || /[A-Z][A-Za-z0-9]+\.tsx$/.test(file))
  .sort();
const potentiallyUnusedComponents = componentFiles
  .filter((file) => !isReferencedByOtherSource(file))
  .sort();

const routeFiles = sourceFiles
  .filter((file) => /\/(?:app|pages)\/.+(?:page|route)\.tsx?$/.test(file) || /controller\.ts$/.test(file))
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
    potentiallyUnusedExports: potentiallyUnusedExports.length,
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
  potentiallyUnusedExports: potentiallyUnusedExports.slice(0, 300),
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
  return /\.(spec|test)\.tsx?$/.test(file) || file.includes('/__tests__/');
}

function isEntrypoint(file) {
  return /(?:^|\/)(main|index|app|module)\.tsx?$/.test(file) || file.endsWith('.module.ts');
}

function isReferencedByOtherSource(file) {
  const base = file.replace(/\.(tsx?|mts|cts|css|scss|sass)$/, '');
  const basename = base.split('/').at(-1);
  const importSpec = base.startsWith('apps/') || base.startsWith('packages/') || base.startsWith('tools/') ? base : `./${base}`;
  for (const [otherFile, text] of textByFile.entries()) {
    if (otherFile === file || !sourceExtensions.has(extname(otherFile))) continue;
    const relativeSpec = relativeImportSpecifier(otherFile, base);
    if (text.includes(`'${relativeSpec}'`) || text.includes(`"${relativeSpec}"`)) return true;
    if (text.includes(`'${importSpec}'`) || text.includes(`"${importSpec}"`)) return true;
    if (basename && text.includes(`from './${basename}'`)) return true;
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
