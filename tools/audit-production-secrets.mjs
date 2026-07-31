import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const MAX_SCANNED_BYTES = 5_000_000;
const secretFilePattern = /(^|\/)(\.env(?:\.[^/]+)?|id_rsa|id_ed25519|.*\.(?:pem|p12|pfx|key))$/i;
const contentPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:aws_access_key_id|aws_secret_access_key)\s*[=:]\s*[^\s"']+/i,
  /(?:jwt|refresh|encryption|api|client|webhook)[_-]?secret\s*[=:]\s*["'][^"']{16,}["']/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bsk_live_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
];
const passwordAssignmentPattern = /(?:password|passwd)\s*[=:]\s*["']([^"']{12,})["']/gi;
const sensitiveAssignmentPattern = /(?:secret|token|api[_-]?key|private[_-]?key)\s*[=:]\s*["']([^"']{24,})["']/gi;

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

function isLikelyMachinePassword(value) {
  return /^[\x21-\x7e]{12,}$/.test(value);
}

function findAssignments(content, sourcePattern, predicate) {
  const pattern = new RegExp(sourcePattern.source, sourcePattern.flags);
  return [...content.matchAll(pattern)]
    .map((match) => match[1] ?? '')
    .filter(predicate);
}

function findLikelyPasswordAssignments(content) {
  return findAssignments(content, passwordAssignmentPattern, isLikelyMachinePassword);
}

function characterClassCount(value) {
  return [/[a-z]/.test(value), /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)]
    .filter(Boolean)
    .length;
}

function findHighEntropySensitiveAssignments(content) {
  return findAssignments(
    content,
    sensitiveAssignmentPattern,
    (value) => !/^(?:set_in_local_env|change-me|example|placeholder)/i.test(value) && characterClassCount(value) >= 3,
  );
}

function isLikelyText(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8_192));
  return !sample.includes(0);
}

function verifyHeuristics() {
  const passwordKey = ['pass', 'word'].join('');
  const passwdKey = ['pass', 'wd'].join('');
  const uiCopy = `${passwordKey}: 'Create password'\n${passwordKey}: 'สร้างรหัสผ่าน'`;
  const realSecrets = `${passwordKey}: 'S3cur3-Prod-Token-123'\n${passwdKey}='averylongalphabeticpassword'`;

  if (findLikelyPasswordAssignments(uiCopy).length !== 0) {
    throw new Error('Production secret heuristic must ignore human-facing password labels');
  }
  if (findLikelyPasswordAssignments(realSecrets).length !== 2) {
    throw new Error('Production secret heuristic must detect compact machine credentials');
  }

  const placeholder = "api_key='set_in_local_env'";
  const likelySecret = "api_key='AbCdEf0123456789+/AbCdEf0123456789'";
  if (findHighEntropySensitiveAssignments(placeholder).length !== 0) {
    throw new Error('Sensitive assignment heuristic must ignore documented placeholders');
  }
  if (findHighEntropySensitiveAssignments(likelySecret).length !== 1) {
    throw new Error('Sensitive assignment heuristic must detect high-entropy credentials');
  }
}

verifyHeuristics();

const failures = [];
const files = trackedFiles();
let textFilesScanned = 0;
let oversizedFiles = 0;

for (const path of files) {
  const absolute = join(root, path);
  if (secretFilePattern.test(path) && !allowedSecretFiles.has(path)) {
    failures.push(`${path}: secret-bearing file must not be committed`);
  }

  const info = await stat(absolute).catch(() => null);
  if (!info?.isFile()) continue;
  if (info.size > MAX_SCANNED_BYTES) {
    oversizedFiles += 1;
    continue;
  }
  if (allowedFixtureContentFiles.has(path)) continue;

  const buffer = await readFile(absolute).catch(() => null);
  if (buffer == null || !isLikelyText(buffer)) continue;
  const content = buffer.toString('utf8');
  textFilesScanned += 1;

  for (const pattern of contentPatterns) {
    if (pattern.test(content)) failures.push(`${path}: possible production secret detected by ${pattern}`);
  }
  if (findLikelyPasswordAssignments(content).length > 0) {
    failures.push(`${path}: possible production password assignment detected`);
  }
  if (findHighEntropySensitiveAssignments(content).length > 0) {
    failures.push(`${path}: possible high-entropy production credential detected`);
  }
}

console.log('Production secret guard');
console.log(`  tracked files: ${files.length}`);
console.log(`  text files scanned: ${textFilesScanned}`);
console.log(`  files over ${MAX_SCANNED_BYTES} bytes: ${oversizedFiles}`);
console.log(`  allowed fixture files: ${allowedFixtureContentFiles.size}`);
console.log(`  violations: ${failures.length}`);
if (failures.length) {
  for (const failure of [...new Set(failures)]) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
