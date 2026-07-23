import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifier = path.join(repositoryRoot, 'tools/verify-member-reference-assets.mjs');
const filenames = [
  'a426b420-d905-4a61-bac3-fb9f69b57901.png',
  'eb8a2aa7-d675-4bc0-bd1f-64e25aba8ffe.png',
  '009138d7-8a4f-44ef-a315-49d300f6f6e1.png',
  'e6a882fe-0528-48d5-9707-8e563f1aeb96.png',
];
const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function run(directory) {
  return spawnSync(process.execPath, [verifier, directory, '--json'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
}

async function withDirectory(callback) {
  const directory = await mkdtemp(path.join(tmpdir(), 'member-assets-'));
  try {
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('fails when required assets are missing', async () => {
  await withDirectory(async (directory) => {
    const result = run(directory);
    assert.notEqual(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ready, false);
    assert.equal(report.invalid, 4);
  });
});

test('accepts unique PNG-shaped binaries above the minimum size', async () => {
  await withDirectory(async (directory) => {
    for (const [index, filename] of filenames.entries()) {
      const payload = Buffer.alloc(2048, index + 1);
      signature.copy(payload, 0);
      await writeFile(path.join(directory, filename), payload);
    }

    const result = run(directory);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ready, true);
    assert.equal(report.valid, 4);
  });
});

test('rejects duplicated binaries assigned to different roles', async () => {
  await withDirectory(async (directory) => {
    const duplicate = Buffer.alloc(2048, 7);
    signature.copy(duplicate, 0);
    for (const filename of filenames) await writeFile(path.join(directory, filename), duplicate);

    const result = run(directory);
    assert.notEqual(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.equal(report.ready, false);
    assert.equal(report.results.filter((entry) => entry.duplicateOf !== null).length, 3);
  });
});
