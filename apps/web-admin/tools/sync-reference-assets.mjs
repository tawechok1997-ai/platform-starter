import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rename, rm, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

const workspaceRoot = resolve(
  process.env.ADMIN_REFERENCE_ASSET_WORKSPACE_ROOT
    ?? resolve(process.cwd(), '../..'),
);
const source = resolve(
  process.env.ADMIN_REFERENCE_ASSET_SOURCE
    ?? resolve(process.cwd(), '../web-member/public/assets/reference-brand'),
);
const destination = resolve(
  process.env.ADMIN_REFERENCE_ASSET_DESTINATION
    ?? resolve(process.cwd(), 'public/assets/reference-brand'),
);
const writeChanges = process.argv.includes('--write');

function assertInsideWorkspace(path, label) {
  const rel = relative(workspaceRoot, path);
  if (!rel || rel === '.') return;
  if (rel === '..' || rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) || isAbsolute(rel)) {
    throw new Error(`${label} must stay inside workspace root: ${path}`);
  }
}

function isSameOrAncestor(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(rel));
}

function assertSafePaths() {
  assertInsideWorkspace(source, 'Reference asset source');
  assertInsideWorkspace(destination, 'Reference asset destination');
  if (source === destination || isSameOrAncestor(source, destination) || isSameOrAncestor(destination, source)) {
    throw new Error(`Reference asset source and destination must be separate trees: ${source} -> ${destination}`);
  }
}

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

function sameInventory(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function assertNoUnmanagedDestinationFiles(sourceFiles) {
  const destinationInfo = await stat(destination).catch(() => null);
  if (!destinationInfo) return;
  if (!destinationInfo.isDirectory()) {
    throw new Error(`Reference asset destination is not a directory: ${destination}`);
  }

  const destinationFiles = await inventory(destination);
  const ownedPaths = new Set(sourceFiles.map((file) => file.path));
  const unmanaged = destinationFiles
    .map((file) => file.path)
    .filter((path) => !ownedPaths.has(path));
  if (unmanaged.length > 0) {
    throw new Error(
      `Refusing to replace reference assets because destination contains unmanaged files: ${unmanaged.join(', ')}`,
    );
  }
}

async function writeSafely(sourceFiles) {
  await assertNoUnmanagedDestinationFiles(sourceFiles);
  const parent = resolve(destination, '..');
  await mkdir(parent, { recursive: true });
  const temporary = resolve(parent, `.reference-brand.tmp-${process.pid}-${Date.now()}`);
  assertInsideWorkspace(temporary, 'Reference asset temporary directory');

  try {
    await rm(temporary, { recursive: true, force: true });
    await cp(source, temporary, { recursive: true, force: true });
    await assertDirectory(temporary, 'Reference asset temporary copy');
    const temporaryFiles = await inventory(temporary);
    if (!sameInventory(sourceFiles, temporaryFiles)) {
      throw new Error('Temporary reference asset copy failed integrity verification.');
    }

    await rm(destination, { recursive: true, force: true });
    await rename(temporary, destination);
    const destinationFiles = await inventory(destination);
    if (!sameInventory(sourceFiles, destinationFiles)) {
      throw new Error('Reference asset destination failed post-write integrity verification.');
    }
    console.log(`Synced reference assets safely: ${source} -> ${destination}`);
  } finally {
    await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
  }
}

assertSafePaths();
await assertDirectory(source, 'Reference asset source');
const sourceFiles = await inventory(source);

if (writeChanges) {
  await writeSafely(sourceFiles);
} else {
  await assertDirectory(destination, 'Reference asset destination');
  const destinationFiles = await inventory(destination);
  if (!sameInventory(sourceFiles, destinationFiles)) {
    console.error('Admin reference assets are out of sync.');
    console.error('Run `pnpm --filter @platform/web-admin write:reference-assets`, review the diff, and commit it before building.');
    process.exitCode = 1;
  } else {
    console.log(`Reference assets verified without writes: ${sourceFiles.length} files`);
  }
}
