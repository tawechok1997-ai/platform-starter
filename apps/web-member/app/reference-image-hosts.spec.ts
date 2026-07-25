import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const nextConfig = readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
const catalog = readFileSync(path.join(process.cwd(), 'app/components/reference-asset-catalog.ts'), 'utf8');

test('allows every external host used by the supplied reference catalog', () => {
  for (const hostname of ['cdn.zabbet.com', 'noah345.shop']) {
    assert.equal(catalog.includes(`https://${hostname}/`), true);
    assert.equal(nextConfig.includes(`hostname: '${hostname}'`), true);
  }
});

test('keeps reference image permissions host-scoped', () => {
  assert.equal(nextConfig.includes("hostname: '**'"), false);
  assert.equal(nextConfig.includes("hostname: '*'"), false);
  assert.equal(nextConfig.includes("protocol: 'http'"), false);
  assert.equal(nextConfig.includes("pathname: '/**'"), true);
});
