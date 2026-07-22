import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve(process.cwd(), '../web-member/public/assets/reference-brand');
const destination = resolve(process.cwd(), 'public/assets/reference-brand');

async function assertDirectory(path, label) {
  const info = await stat(path).catch(() => null);
  if (!info?.isDirectory()) {
    throw new Error(`${label} directory not found: ${path}`);
  }
}

await assertDirectory(source, 'Reference asset source');
await mkdir(resolve(process.cwd(), 'public/assets'), { recursive: true });
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true, force: true });
await assertDirectory(destination, 'Reference asset destination');

console.log(`Synced reference assets: ${source} -> ${destination}`);
