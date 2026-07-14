import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_SRC = path.join(ROOT, 'apps', 'api', 'src');
const JSON_MODE = process.env.R009_REPOSITORY_JSON === '1';
const STRICT_MODE = process.env.R009_REPOSITORY_STRICT === '1';

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function isPersistenceAgnosticContract(file) {
  const normalized = relative(file);
  if (normalized.includes('/domain/') || normalized.includes('/application/')) return true;

  // Repository implementations are allowed to depend on Prisma. Only explicit
  // port/interface/contract naming outside domain/application is treated as a
  // persistence-agnostic boundary.
  return /(?:\.port|\.repository-port|\.repository\.interface|\.repository\.contract)\.ts$/.test(normalized);
}

const candidateFiles = walk(API_SRC)
  .filter((file) => file.endsWith('.ts'))
  .filter(isPersistenceAgnosticContract)
  .sort();

const patterns = [
  { kind: 'prisma-client-import', regex: /from\s+['"]@prisma\/client(?:\/[^'"]*)?['"]/g },
  { kind: 'prisma-service-import', regex: /from\s+['"][^'"]*prisma\.service['"]/g },
  { kind: 'prisma-type-reference', regex: /\bPrisma\.(?:Decimal|JsonValue|InputJsonValue|TransactionClient|[A-Z][A-Za-z0-9_]*)\b/g },
  { kind: 'prisma-service-reference', regex: /\bPrismaService\b/g },
];

const violations = [];
for (const file of candidateFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const { kind, regex } of patterns) {
    for (const match of source.matchAll(regex)) {
      violations.push({
        file: relative(file),
        kind,
        line: lineNumber(source, match.index ?? 0),
        text: match[0],
      });
    }
  }
}

const result = {
  audit: 'R-009 repository boundary Prisma leakage',
  scannedFiles: candidateFiles.length,
  violationCount: violations.length,
  strict: STRICT_MODE,
  violations,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-009 repository boundary audit: scanned ${candidateFiles.length} candidate file(s).`);
  if (violations.length === 0) {
    console.log('No Prisma imports or Prisma-specific types were detected in domain/application repository contracts.');
  } else {
    console.log(`Detected ${violations.length} repository boundary violation(s):`);
    for (const violation of violations) {
      console.log(`- ${violation.file}:${violation.line} ${violation.kind}`);
    }
  }
}

if (STRICT_MODE && violations.length > 0) {
  console.error('R-009 strict repository boundary guard failed. Domain/application ports must remain persistence-agnostic.');
  process.exitCode = 1;
}
