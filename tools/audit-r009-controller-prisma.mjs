import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_SRC = path.join(ROOT, 'apps', 'api', 'src');
const JSON_MODE = process.env.R009_JSON === '1';
const STRICT_MODE = process.env.R009_STRICT === '1';

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

function findMatches(source, pattern, kind) {
  const matches = [];
  for (const match of source.matchAll(pattern)) {
    matches.push({ kind, line: lineNumber(source, match.index ?? 0), text: match[0].trim() });
  }
  return matches;
}

const controllerFiles = walk(API_SRC)
  .filter((file) => file.endsWith('.controller.ts'))
  .sort();

const inventory = controllerFiles.map((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const findings = [
    ...findMatches(source, /from\s+['"]@prisma\/client(?:\/[^'"]*)?['"]/g, 'prisma-client-import'),
    ...findMatches(source, /from\s+['"][^'"]*prisma\.service['"]/g, 'prisma-service-import'),
    ...findMatches(source, /\bPrismaService\b/g, 'prisma-service-reference'),
    ...findMatches(source, /\b(?:this\.)?prisma\s*\./g, 'direct-prisma-member-access'),
    ...findMatches(source, /\$transaction\s*\(/g, 'transaction-in-controller'),
    ...findMatches(source, /\$(?:queryRaw|executeRaw)(?:Unsafe)?\s*[<(]/g, 'raw-query-in-controller'),
  ];

  const deduped = findings.filter((finding, index, all) =>
    all.findIndex((candidate) => candidate.kind === finding.kind && candidate.line === finding.line) === index,
  );

  return { file: relative(file), findings: deduped };
});

const offenders = inventory.filter((entry) => entry.findings.length > 0);
const result = {
  audit: 'R-009 controller Prisma inventory',
  scannedControllers: controllerFiles.length,
  offendingControllers: offenders.length,
  strict: STRICT_MODE,
  offenders,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-009 controller Prisma inventory: scanned ${controllerFiles.length} controller(s).`);
  if (offenders.length === 0) {
    console.log('No direct Prisma usage was detected in controllers.');
  } else {
    console.log(`Detected direct Prisma-related usage in ${offenders.length} controller(s):`);
    for (const entry of offenders) {
      console.log(`- ${entry.file}`);
      for (const finding of entry.findings) {
        console.log(`  line ${finding.line}: ${finding.kind}`);
      }
    }
  }
}

if (STRICT_MODE && offenders.length > 0) {
  console.error('R-009 strict guard failed: controllers must delegate persistence to application services or repositories.');
  process.exitCode = 1;
}
