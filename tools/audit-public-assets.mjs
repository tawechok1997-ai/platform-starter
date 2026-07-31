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
const warnings = [];
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
  if (/\.map$/i.test(normalized)) {
    warnings.push(`${normalized}: quarantined source map remains scheduled for asset migration`);
  }
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

for (const configPath of ['apps/web-member/next.config.js', 'apps/web-admin/next.config.js']) {
  const source = await readFile(join(root, configPath), 'utf8').catch(() => '');
  for (const required of [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Permissions-Policy',
    'poweredByHeader: false',
    'NEXT_PUBLIC_API_URL',
  ]) {
    if (!source.includes(required)) failures.push(`${configPath}: missing browser security contract ${required}`);
  }
  if (source.includes('upgrade-insecure-requests')) {
    failures.push(`${configPath}: unconditional upgrade-insecure-requests breaks approved HTTP test environments`);
  }
}

console.log('Public asset and browser security audit');
console.log(`  public files: ${publicFiles.length}`);
console.log(`  quarantined executable assets: ${quarantinedExecutables.length}`);
console.log(`  warnings: ${warnings.length}`);
console.log(`  violations: ${failures.length}`);

if (warnings.length > 0) {
  console.warn('\nPublic asset migration warnings:');
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (failures.length > 0) {
  console.error('\nPublic asset violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
