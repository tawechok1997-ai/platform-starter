import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogDirectory = path.join(
  repositoryRoot,
  'apps/api/src/modules/provider-simulator',
);
const catalogFilePattern = /^provider-simulator-lobby-catalog-part-\d{2}\.generated\.ts$/;
const brokenHeader = "import type { SimulatorGameCatalogItem } from './provider-simulator-catalog';\\n\\nexport const ";
const validHeader = "import type { SimulatorGameCatalogItem } from './provider-simulator-catalog';\n\nexport const ";

const fileNames = (await readdir(catalogDirectory))
  .filter((fileName) => catalogFilePattern.test(fileName))
  .sort();

if (fileNames.length === 0) {
  throw new Error(`No generated lobby catalog parts found in ${catalogDirectory}`);
}

let normalizedCount = 0;

for (const fileName of fileNames) {
  const filePath = path.join(catalogDirectory, fileName);
  const source = await readFile(filePath, 'utf8');
  let normalized = source;

  if (source.startsWith(brokenHeader)) {
    normalized = validHeader + source.slice(brokenHeader.length);
  }

  const firstLine = normalized.split(/\r?\n/, 1)[0] ?? '';
  if (firstLine.includes('\\n')) {
    throw new Error(`${fileName} still contains an escaped newline in its generated header`);
  }

  if (!normalized.startsWith(validHeader)) {
    throw new Error(`${fileName} has an unexpected generated header`);
  }

  if (normalized !== source) {
    await writeFile(filePath, normalized, 'utf8');
    normalizedCount += 1;
  }
}

console.log(
  `Generated lobby catalog headers valid: ${fileNames.length}; normalized: ${normalizedCount}`,
);
