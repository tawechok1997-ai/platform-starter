import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const tracked = execFileSync('git', ['ls-files', '-z'], {
  cwd: root,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
}).split('\0').filter(Boolean);

const publicFiles = tracked.filter((path) => /(^|\/)public\//.test(path));
const executablePattern = /\.(?:css|html?|js|mjs|cjs|map|wasm)$/i;
const quarantinedRoots = [
  'apps/web-member/public/assets/asset-pc/',
  'apps/web-member/public/assets/asset-mobile/',
];
const failures = [];
const quarantinedExecutables = [];

for (const path of publicFiles) {
  const normalized = path.replaceAll('\\', '/');
  const fileName = normalized.split('/').pop() ?? '';

  if (/^(?:undefined|null)(?:[_.-]|$)/i.test(fileName)) {
    failures.push(`${normalized}: malformed generated filename`);
  }

  if (!executablePattern.test(normalized)) continue;

  const quarantined = quarantinedRoots.some((prefix) => normalized.startsWith(prefix));
  if (!quarantined) {
    failures.push(`${normalized}: executable asset is not allowed in public/`);
    continue;
  }

  quarantinedExecutables.push(normalized);
  if (/\.map$/i.test(normalized)) failures.push(`${normalized}: source maps must not be committed under public/`);
}

const middlewarePath = join(root, 'apps/web-member/middleware.ts');
const middleware = await readFile(middlewarePath, 'utf8').catch(() => '');
for (const required of ['LEGACY_REFERENCE_ROOTS', 'EXECUTABLE_ASSET_PATTERN', "status: 404"]) {
  if (!middleware.includes(required)) failures.push(`apps/web-member/middleware.ts: missing legacy asset quarantine marker ${required}`);
}

for (const path of quarantinedExecutables) {
  const info = await stat(join(root, path)).catch(() => null);
  if (info?.size === 0) failures.push(`${path}: empty executable artifact`);
}

console.log('Public asset security audit');
console.log(`  public files: ${publicFiles.length}`);
console.log(`  quarantined executable assets: ${quarantinedExecutables.length}`);
console.log(`  violations: ${failures.length}`);

if (failures.length > 0) {
  console.error('\nPublic asset violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
