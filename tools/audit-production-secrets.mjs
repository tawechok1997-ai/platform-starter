import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const secretFilePattern = /(^|\/)(\.env(?:\.[^/]+)?|id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key))$/i;
const contentPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:aws_access_key_id|aws_secret_access_key)\s*[=:]\s*[^\s"']+/i,
  /(?:jwt|refresh|encryption|api|client|webhook)[_-]?secret\s*[=:]\s*["'][^"']{16,}["']/i,
  /(?:password|passwd)\s*[=:]\s*["'][^"']{12,}["']/i,
];

const allowedSecretFiles = new Set(['.env.example', '.env.test.example']);
const allowedFixtureContentFiles = new Set([
  'apps/api/src/modules/auth/auth.service.spec.ts',
  'apps/api/src/modules/game-platform/adapters/generic-transfer-provider.adapter.spec.ts',
  'apps/web-admin/app/(auth)/login/page.tsx',
  'apps/web-member/app/(auth)/login/page.tsx',
  'prisma/seed-games.ts',
  'tools/check-p6-readiness.test.mjs',
]);

function trackedFiles() {
  const raw = execFileSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return raw.split('\0').filter(Boolean);
}

const failures = [];
const files = trackedFiles();

for (const path of files) {
  const absolute = join(root, path);
  if (secretFilePattern.test(path) && !allowedSecretFiles.has(path)) {
    failures.push(`${path}: secret-bearing file must not be committed`);
  }

  const info = await stat(absolute).catch(() => null);
  if (!info?.isFile() || info.size > 1_000_000) continue;
  if (allowedFixtureContentFiles.has(path)) continue;

  const content = await readFile(absolute, 'utf8').catch(() => null);
  if (content == null) continue;
  for (const pattern of contentPatterns) {
    if (pattern.test(content)) failures.push(`${path}: possible production secret detected by ${pattern}`);
  }
}

console.log('Production secret guard');
console.log(`  tracked files scanned: ${files.length}`);
console.log(`  allowed fixture files: ${allowedFixtureContentFiles.size}`);
console.log(`  violations: ${failures.length}`);
if (failures.length) {
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
