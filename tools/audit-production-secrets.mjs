import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', '.next', 'dist', 'coverage', 'playwright-report', 'test-results']);
const secretFilePattern = /(^|\/)(\.env(?:\.[^/]+)?|id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key))$/i;
const contentPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:aws_access_key_id|aws_secret_access_key)\s*[=:]\s*[^\s"']+/i,
  /(?:jwt|refresh|encryption|api|client|webhook)[_-]?secret\s*[=:]\s*["'][^"']{16,}["']/i,
  /(?:password|passwd)\s*[=:]\s*["'][^"']{12,}["']/i,
];

const allowedSecretFiles = new Set(['.env.example', '.env.test.example']);
const failures = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const absolute = join(directory, entry.name);
    const path = relative(root, absolute).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      await walk(absolute);
      continue;
    }
    if (!entry.isFile()) continue;
    if (secretFilePattern.test(path) && !allowedSecretFiles.has(path)) failures.push(`${path}: secret-bearing file must not be committed`);
    const info = await stat(absolute);
    if (info.size > 1_000_000) continue;
    const content = await readFile(absolute, 'utf8').catch(() => null);
    if (content == null) continue;
    for (const pattern of contentPatterns) {
      if (pattern.test(content)) failures.push(`${path}: possible production secret detected by ${pattern}`);
    }
  }
}

await walk(root);
console.log('Production secret guard');
console.log(`  violations: ${failures.length}`);
if (failures.length) {
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
