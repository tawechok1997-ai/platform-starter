import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

type Manifest = {
  source: string;
  items: Record<string, {
    path: string;
    sourcePath: string;
    sha256: string;
  }>;
};

const menuDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../public/assets/reference-brand/menu',
);

test('reference menu manifest points to non-empty project assets', async () => {
  const manifest = JSON.parse(
    await readFile(join(menuDirectory, 'manifest.json'), 'utf8'),
  ) as Manifest;

  assert.match(manifest.source, /noah345/i);
  assert.ok(Object.keys(manifest.items).length >= 19);

  for (const [key, item] of Object.entries(manifest.items)) {
    assert.match(item.path, /^\/assets\/reference-brand\/menu\/[a-z0-9-]+\.png$/);
    assert.ok(item.sourcePath.startsWith('assets/menu/'), `${key} source path`);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);

    const file = await stat(join(menuDirectory, basename(item.path)));
    assert.ok(file.isFile(), `${key} must be a file`);
    assert.ok(file.size > 0, `${key} must not be empty`);
  }
});
