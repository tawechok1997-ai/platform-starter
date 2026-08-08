import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

const adminRoot = process.cwd();
const script = resolve(adminRoot, 'tools/sync-reference-assets.mjs');
const packageJson = readFileSync(resolve(adminRoot, 'package.json'), 'utf8');

type Fixture = {
  root: string;
  source: string;
  destination: string;
};

function fixture(): Fixture {
  const root = mkdtempSync(join(tmpdir(), 'admin-ref-sync-'));
  const source = join(root, 'apps/web-member/public/assets/reference-brand');
  const destination = join(root, 'apps/web-admin/public/assets/reference-brand');
  mkdirSync(source, { recursive: true });
  mkdirSync(destination, { recursive: true });
  return { root, source, destination };
}

function write(path: string, value: string) {
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, value, 'utf8');
}

function run(current: Fixture, args: string[] = [], overrides: Record<string, string> = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: adminRoot,
    env: {
      ...process.env,
      ADMIN_REFERENCE_ASSET_WORKSPACE_ROOT: current.root,
      ADMIN_REFERENCE_ASSET_SOURCE: current.source,
      ADMIN_REFERENCE_ASSET_DESTINATION: current.destination,
      ...overrides,
    },
    encoding: 'utf8',
  });
}

function output(result: ReturnType<typeof run>) {
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

test('check mode detects drift without modifying destination files', () => {
  const current = fixture();
  try {
    write(join(current.source, 'menu/icon.txt'), 'new');
    write(join(current.destination, 'menu/icon.txt'), 'old');

    const result = run(current);

    assert.notEqual(result.status, 0);
    assert.match(output(result), /out of sync/i);
    assert.equal(readFileSync(join(current.destination, 'menu/icon.txt'), 'utf8'), 'old');
  } finally {
    rmSync(current.root, { recursive: true, force: true });
  }
});

test('missing source fails closed before destination mutation', () => {
  const current = fixture();
  try {
    rmSync(current.source, { recursive: true, force: true });
    write(join(current.destination, 'owned.txt'), 'keep');

    const result = run(current, ['--write']);

    assert.notEqual(result.status, 0);
    assert.match(output(result), /Reference asset source directory not found/);
    assert.equal(readFileSync(join(current.destination, 'owned.txt'), 'utf8'), 'keep');
  } finally {
    rmSync(current.root, { recursive: true, force: true });
  }
});

test('workspace guard rejects a destination outside the declared workspace', () => {
  const current = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'admin-ref-sync-outside-'));
  try {
    write(join(current.source, 'owned.txt'), 'source');

    const result = run(current, ['--write'], {
      ADMIN_REFERENCE_ASSET_DESTINATION: join(outside, 'reference-brand'),
    });

    assert.notEqual(result.status, 0);
    assert.match(output(result), /must stay inside workspace root/);
  } finally {
    rmSync(current.root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('write mode refuses to delete destination files that the source does not own', () => {
  const current = fixture();
  try {
    write(join(current.source, 'owned.txt'), 'same');
    write(join(current.destination, 'owned.txt'), 'same');
    write(join(current.destination, 'admin-only.txt'), 'must survive');

    const result = run(current, ['--write']);

    assert.notEqual(result.status, 0);
    assert.match(output(result), /unmanaged files: admin-only\.txt/);
    assert.equal(readFileSync(join(current.destination, 'admin-only.txt'), 'utf8'), 'must survive');
  } finally {
    rmSync(current.root, { recursive: true, force: true });
  }
});

test('explicit write replaces the managed tree only after temporary-copy verification', () => {
  const current = fixture();
  try {
    write(join(current.source, 'menu/icon.txt'), 'new');
    write(join(current.destination, 'menu/icon.txt'), 'old');

    const result = run(current, ['--write']);

    assert.equal(result.status, 0, output(result));
    assert.match(output(result), /Synced reference assets safely/);
    assert.equal(readFileSync(join(current.destination, 'menu/icon.txt'), 'utf8'), 'new');
    const parent = resolve(current.destination, '..');
    assert.equal(
      readdirSync(parent).some((name) => name.startsWith('.reference-brand.tmp-')),
      false,
    );
  } finally {
    rmSync(current.root, { recursive: true, force: true });
  }
});

test('Admin dev and build flows are check-only while writes remain explicit', () => {
  const parsed = JSON.parse(packageJson) as { scripts: Record<string, string> };

  assert.equal(parsed.scripts.dev, 'pnpm check:reference-assets && next dev -p 3001');
  assert.equal(parsed.scripts.build, 'pnpm sync:reference-assets && next build');
  assert.equal(
    parsed.scripts.analyze,
    'pnpm sync:reference-assets && ANALYZE=true next build && node tools/check-performance-budget.mjs',
  );
  assert.equal(parsed.scripts['write:reference-assets'], 'node tools/sync-reference-assets.mjs --write');
  assert.equal(parsed.scripts.dev.includes('--write'), false);
  assert.equal(parsed.scripts.build.includes('--write'), false);
  assert.equal(parsed.scripts.analyze.includes('--write'), false);
  assert.equal(existsSync(script), true);
});
