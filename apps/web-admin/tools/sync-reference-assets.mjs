import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

const source = resolve(process.cwd(), '../web-member/public/assets/reference-brand');
const destination = resolve(process.cwd(), 'public/assets/reference-brand');
const writeChanges = process.argv.includes('--write');

async function assertDirectory(path, label) {
  const info = await stat(path).catch(() => null);
  if (!info?.isDirectory()) throw new Error(`${label} directory not found: ${path}`);
}

async function inventory(root) {
  const files = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = resolve(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const content = await readFile(absolute);
      files.push({
        path: relative(root, absolute).replaceAll('\\', '/'),
        sha256: createHash('sha256').update(content).digest('hex'),
        size: content.byteLength,
      });
    }
  }

  await walk(root);
  return files.sort((left, right) => left.path.localeCompare(right.path));
}

await assertDirectory(source, 'Reference asset source');

if (writeChanges) {
  await mkdir(resolve(process.cwd(), 'public/assets'), { recursive: true });
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true, force: true });
  await assertDirectory(destination, 'Reference asset destination');
  console.log(`Synced reference assets: ${source} -> ${destination}`);
} else {
  await assertDirectory(destination, 'Reference asset destination');
  const [sourceFiles, destinationFiles] = await Promise.all([
    inventory(source),
    inventory(destination),
  ]);
  const sourceJson = JSON.stringify(sourceFiles);
  const destinationJson = JSON.stringify(destinationFiles);

  if (sourceJson !== destinationJson) {
    console.error('Admin reference assets are out of sync.');
    console.error('Run `pnpm --filter @platform/web-admin sync:reference-assets`, review the diff, and commit it before building.');
    process.exitCode = 1;
  } else {
    console.log(`Reference assets verified: ${sourceFiles.length} files`);
  }
}
