import { cp, mkdir, access, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const sourceArg = process.argv[2];
if (!sourceArg) {
  console.error('Usage: pnpm import:v47-assets <path-to-extracted-v47-folder>');
  process.exit(1);
}

const sourceRoot = path.resolve(sourceArg);
const sourceAssets = path.join(sourceRoot, 'assets');
const target = path.resolve('apps/web-member/public/v47-assets');

await access(sourceAssets).catch(() => {
  console.error(`V47 assets folder not found: ${sourceAssets}`);
  process.exit(1);
});

await mkdir(target, { recursive: true });
await cp(sourceAssets, target, { recursive: true, force: true });

const summary = await countFiles(target);
console.log(`Imported ${summary.files} V47 asset files (${formatBytes(summary.bytes)}) into ${target}`);

async function countFiles(root) {
  let files = 0;
  let bytes = 0;
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const child = await countFiles(fullPath);
      files += child.files;
      bytes += child.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += (await stat(fullPath)).size;
    }
  }
  return { files, bytes };
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}
