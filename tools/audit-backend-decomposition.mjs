import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const root = process.cwd();
const sourceRoot = join(root, 'apps', 'api', 'src');
const limits = {
  controllerLines: 350,
  serviceLines: 600,
  constructorDependencies: 8,
  publicMethods: 20,
};

async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (['node_modules', 'dist', '.next', 'generated'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && ['.ts', '.mts', '.cts'].includes(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalize(path) {
  return relative(root, path).split(sep).join('/');
}

function countConstructorDependencies(source) {
  const match = source.match(/constructor\s*\(([^)]*)\)/s);
  if (!match) return 0;
  return [...match[1].matchAll(/(?:private|public|protected|readonly|@Inject\([^)]*\))[^,)]*/g)].length;
}

function countPublicMethods(source) {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  return [...withoutComments.matchAll(/^\s{2}(?!private\s|protected\s|static\s|constructor\b)(?:async\s+)?[A-Za-z_$][\w$]*\s*\([^)]*\)\s*(?::[^\{]+)?\{/gm)].length;
}

const files = await walk(sourceRoot);
const candidates = [];
for (const file of files) {
  const kind = file.endsWith('.controller.ts') ? 'controller' : file.endsWith('.service.ts') ? 'service' : null;
  if (!kind) continue;
  const source = await readFile(file, 'utf8');
  const lines = source.split(/\r?\n/).length;
  const constructorDependencies = countConstructorDependencies(source);
  const publicMethods = countPublicMethods(source);
  const over = {
    lines: lines > limits[kind === 'controller' ? 'controllerLines' : 'serviceLines'],
    dependencies: constructorDependencies > limits.constructorDependencies,
    methods: publicMethods > limits.publicMethods,
  };
  if (over.lines || over.dependencies || over.methods) {
    candidates.push({ file: normalize(file), kind, lines, constructorDependencies, publicMethods, over });
  }
}

candidates.sort((a, b) => b.lines - a.lines || b.constructorDependencies - a.constructorDependencies);
const report = {
  generatedAt: new Date().toISOString(),
  limits,
  scannedFiles: files.length,
  candidates,
};

if (process.env.R007_JSON === '1') {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`R-007 backend decomposition inventory: ${files.length} TypeScript files scanned`);
  console.log(`  oversized/high-coupling candidates: ${candidates.length}`);
  for (const item of candidates) {
    const reasons = Object.entries(item.over).filter(([, value]) => value).map(([key]) => key).join(', ');
    console.log(`  - ${item.file}: ${item.lines} lines, ${item.constructorDependencies} deps, ${item.publicMethods} public methods [${reasons}]`);
  }
}

// Inventory is informational at the start of R-007. Set R007_ENFORCE=1 only after
// the current debt is documented and ratcheted down.
if (process.env.R007_ENFORCE === '1' && candidates.length) process.exitCode = 1;
