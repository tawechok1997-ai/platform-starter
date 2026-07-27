import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const nextConfig = readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
const catalog = readFileSync(path.join(process.cwd(), 'app/components/reference-asset-catalog.ts'), 'utf8');

function externalCatalogHosts(source: string) {
  return [...source.matchAll(/https:\/\/([^/'"`]+)\//g)].map((match) => match[1]).filter((hostname): hostname is string => Boolean(hostname));
}

test('allows every external host actually used by the reference catalog', () => {
  const hosts = [...new Set(externalCatalogHosts(catalog))];
  for (const hostname of hosts) {
    assert.equal(nextConfig.includes(`hostname: '${hostname}'`), true, `${hostname} must be explicitly allowed`);
  }
});

test('accepts local-only reference assets and rejects unsafe image permissions', () => {
  assert.equal(catalog.includes('http://'), false);
  assert.equal(nextConfig.includes("hostname: '**'"), false);
  assert.equal(nextConfig.includes("hostname: '*'"), false);
  assert.equal(nextConfig.includes("protocol: 'http'"), false);
  assert.equal(nextConfig.includes("pathname: '/**'"), true);
});
