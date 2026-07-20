import { access, mkdir, readFile, rename, rm, stat, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourceRoot = path.join(root, 'asset', 'mobil');
const catalogRoot = path.join(root, 'asset', 'catalog', 'mobile');
const apiCatalogPath = path.join(root, 'apps', 'api', 'src', 'modules', 'provider-simulator', 'provider-simulator-catalog.ts');
const sourceManifestPath = path.join(sourceRoot, 'manifest.json');
const catalogManifestPath = path.join(catalogRoot, 'catalog.json');

const moves = [
  ['cdn.zabbet.com/games/KM/TH/Thai_Hi_Lo_2.jpg', 'games/kingmaker/thai-hi-lo-2.jpg'],
  ['cdn.zabbet.com/games/NLC/bushidoways00000.jpg', 'games/nolimit-city/bushido-ways.jpg'],
  ['cdn.zabbet.com/games/NLC/elpaso0000000000.jpg', 'games/nolimit-city/el-paso.jpg'],
  ['cdn.zabbet.com/games/vertical/CQ/alice_run.jpg', 'games/cq9/alice-run.jpg'],
  ['cdn.zabbet.com/games/vertical/EVP/penalty_series.jpg', 'games/evolution-play/penalty-series.jpg'],
  ['cdn.zabbet.com/games/vertical/PP/sweet_bonanza_xmas.png', 'games/pragmatic-play/sweet-bonanza-xmas.png'],
  ['cdn.zabbet.com/games/FACHAI/TH/27001.jpg', 'games/fa-chai/fachai-27001.jpg'],
  ['cdn.zabbet.com/providers/set/1_1_badge/kingm.png', 'providers/kingmaker.png'],
  ['cdn.zabbet.com/providers/set/1_1_badge/nlc.png', 'providers/nolimit-city.png'],
  ['cdn.zabbet.com/providers/set/1_1_badge/cq.png', 'providers/cq9.png'],
  ['cdn.zabbet.com/providers/set/1_1_badge/evp.png', 'providers/evolution-play.png'],
  ['cdn.zabbet.com/providers/set/1_1_badge/pp.png', 'providers/pragmatic-play.png'],
  ['cdn.zabbet.com/providers/set/1_1_badge/fachai.png', 'providers/fa-chai.png'],
];

const oldPrefix = 'asset/mobil/';
const newPrefix = 'asset/catalog/mobile/';
const moved = [];
const missing = [];

for (const [sourceRelative, targetRelative] of moves) {
  const source = path.join(sourceRoot, ...sourceRelative.split('/'));
  const target = path.join(catalogRoot, ...targetRelative.split('/'));
  const targetExists = await exists(target);
  const sourceExists = await exists(source);

  if (targetExists) {
    if (sourceExists) await rm(source);
    moved.push({ source: `${oldPrefix}${sourceRelative}`, target: `${newPrefix}${targetRelative}`, status: 'already-organized' });
    continue;
  }
  if (!sourceExists) {
    missing.push(`${oldPrefix}${sourceRelative}`);
    continue;
  }

  await mkdir(path.dirname(target), { recursive: true });
  await rename(source, target);
  moved.push({ source: `${oldPrefix}${sourceRelative}`, target: `${newPrefix}${targetRelative}`, status: 'moved' });
}

if (missing.length > 0) {
  throw new Error(`Required game assets are missing:\n${missing.map((item) => `- ${item}`).join('\n')}`);
}

const replacementMap = new Map(moves.map(([source, target]) => [`${oldPrefix}${source}`, `${newPrefix}${target}`]));
let apiCatalog = await readFile(apiCatalogPath, 'utf8');
for (const [source, target] of replacementMap) apiCatalog = apiCatalog.replaceAll(source, target);
apiCatalog = apiCatalog.replace("const MOBILE_ASSET_ROOT = 'asset/mobil/cdn.zabbet.com';\n\n", '');
await writeFile(apiCatalogPath, apiCatalog);

let sourceManifest = [];
if (await exists(sourceManifestPath)) {
  const parsed = JSON.parse(await readFile(sourceManifestPath, 'utf8'));
  sourceManifest = Array.isArray(parsed) ? parsed : [];
}

const sourceByFile = new Map(sourceManifest.filter((item) => item && typeof item.file === 'string').map((item) => [item.file.replaceAll('\\', '/'), item]));
const catalogItems = moves.map(([source, target]) => {
  const original = sourceByFile.get(source);
  return {
    kind: target.startsWith('providers/') ? 'provider-logo' : 'game-image',
    file: target,
    repositoryPath: `${newPrefix}${target}`,
    sourceFile: `${oldPrefix}${source}`,
    sourceUrl: typeof original?.url === 'string' ? original.url : null,
    mimeType: typeof original?.mimeType === 'string' ? original.mimeType : mimeFromExtension(target),
  };
});

const movedSourceSet = new Set(moves.map(([source]) => source));
const normalizedSourceManifest = sourceManifest.filter((entry) => !entry || typeof entry.file !== 'string' || !movedSourceSet.has(entry.file.replaceAll('\\', '/')));
await writeFile(sourceManifestPath, `${JSON.stringify(normalizedSourceManifest, null, 2)}\n`);
await mkdir(catalogRoot, { recursive: true });
await writeFile(catalogManifestPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  platform: 'mobile',
  purpose: 'Assets actively referenced by the platform game catalog',
  counts: {
    total: catalogItems.length,
    games: catalogItems.filter((item) => item.kind === 'game-image').length,
    providers: catalogItems.filter((item) => item.kind === 'provider-logo').length,
  },
  items: catalogItems,
}, null, 2)}\n`);

await removeEmptyDirectories(sourceRoot);
console.log(`Organized ${moved.length} active assets into asset/catalog/mobile.`);
console.log(`Source manifest now contains ${normalizedSourceManifest.length} uncurated entries.`);

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function mimeFromExtension(file) {
  const extension = path.extname(file).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  if (extension === '.svg') return 'image/svg+xml';
  return 'application/octet-stream';
}

async function removeEmptyDirectories(directory) {
  if (!(await exists(directory))) return false;
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) await removeEmptyDirectories(path.join(directory, entry.name));
  }
  if (directory === sourceRoot) return false;
  const remaining = await readdir(directory);
  if (remaining.length === 0) {
    await rm(directory, { recursive: true, force: true });
    return true;
  }
  return false;
}
