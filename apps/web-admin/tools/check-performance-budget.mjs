import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nextRoot = join(appRoot, '.next');
const budget = JSON.parse(await readFile(join(appRoot, 'performance-budget.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(nextRoot, 'app-build-manifest.json'), 'utf8'));
const routeLimitBytes = budget.routeJavaScript.initialKilobytesGzip * 1024;
const chunkLimitBytes = budget.routeJavaScript.largestAsyncChunkKilobytesGzip * 1024;

const routeEntries = Object.entries(manifest.pages ?? {})
  .filter(([route]) => route.endsWith('/page'))
  .map(([route, files]) => ({
    route,
    files: [...new Set(files.filter((file) => file.endsWith('.js')))],
  }));

if (routeEntries.length === 0) {
  throw new Error('Admin performance budget: app-build-manifest contains no page routes.');
}

const gzipCache = new Map();
async function gzipBytes(file) {
  if (!gzipCache.has(file)) {
    const absolutePath = join(nextRoot, file);
    const content = await readFile(absolutePath);
    gzipCache.set(file, gzipSync(content).byteLength);
  }
  return gzipCache.get(file);
}

const routeResults = [];
for (const entry of routeEntries) {
  let bytes = 0;
  for (const file of entry.files) bytes += await gzipBytes(file);
  routeResults.push({
    route: entry.route,
    gzipBytes: bytes,
    gzipKilobytes: roundKilobytes(bytes),
    files: entry.files.length,
  });
}
routeResults.sort((left, right) => right.gzipBytes - left.gzipBytes);

const chunkFiles = (await walk(join(nextRoot, 'static', 'chunks')))
  .filter((file) => file.endsWith('.js'));
const chunkResults = [];
for (const absolutePath of chunkFiles) {
  const file = relative(nextRoot, absolutePath).replaceAll('\\', '/');
  const bytes = await gzipBytes(file);
  chunkResults.push({ file, gzipBytes: bytes, gzipKilobytes: roundKilobytes(bytes) });
}
chunkResults.sort((left, right) => right.gzipBytes - left.gzipBytes);

const routeFailures = routeResults.filter((result) => result.gzipBytes > routeLimitBytes);
const chunkFailures = chunkResults.filter((result) => result.gzipBytes > chunkLimitBytes);
const evidence = {
  generatedAt: new Date().toISOString(),
  budgetVersion: budget.version,
  routeLimitKilobytesGzip: budget.routeJavaScript.initialKilobytesGzip,
  chunkLimitKilobytesGzip: budget.routeJavaScript.largestAsyncChunkKilobytesGzip,
  measuredRoutes: routeResults.length,
  measuredChunks: chunkResults.length,
  largestRoutes: routeResults.slice(0, 10).map(withoutBytes),
  largestChunks: chunkResults.slice(0, 10).map(withoutBytes),
  failures: {
    routes: routeFailures.map(withoutBytes),
    chunks: chunkFailures.map(withoutBytes),
  },
};

await writeFile(
  join(nextRoot, 'performance-budget-evidence.json'),
  `${JSON.stringify(evidence, null, 2)}\n`,
  'utf8',
);

console.log(`Admin performance budget: ${routeResults.length} routes, ${chunkResults.length} chunks.`);
console.log(`Largest route: ${evidence.largestRoutes[0]?.route ?? 'n/a'} (${evidence.largestRoutes[0]?.gzipKilobytes ?? 0} KB gzip / ${evidence.routeLimitKilobytesGzip} KB).`);
console.log(`Largest chunk: ${evidence.largestChunks[0]?.file ?? 'n/a'} (${evidence.largestChunks[0]?.gzipKilobytes ?? 0} KB gzip / ${evidence.chunkLimitKilobytesGzip} KB).`);

if (routeFailures.length || chunkFailures.length) {
  console.error(JSON.stringify(evidence.failures, null, 2));
  process.exitCode = 1;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function roundKilobytes(bytes) {
  return Math.round((bytes / 1024) * 100) / 100;
}

function withoutBytes(value) {
  const { gzipBytes: _gzipBytes, ...result } = value;
  return result;
}
