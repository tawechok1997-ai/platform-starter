import { readFile } from 'node:fs/promises';

const baselinePath = 'docs/architecture/backend-decomposition-baseline.json';
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));
const violations = [];

if (baseline.version !== 1) violations.push('unsupported baseline version');
if (!['pending-inventory-capture', 'approved'].includes(baseline.status)) {
  violations.push(`unsupported status: ${baseline.status}`);
}
if (!Array.isArray(baseline.approvedCandidates)) {
  violations.push('approvedCandidates must be an array');
}
if (baseline.status === 'approved' && !baseline.capturedAt) {
  violations.push('approved baseline requires capturedAt');
}

const severityRank = { moderate: 1, high: 2, critical: 3 };
const keys = new Set();
for (const candidate of baseline.approvedCandidates ?? []) {
  if (!candidate || typeof candidate !== 'object') {
    violations.push('candidate must be an object');
    continue;
  }
  if (typeof candidate.key !== 'string' || !candidate.key.trim()) violations.push('candidate key is required');
  if (keys.has(candidate.key)) violations.push(`duplicate candidate key: ${candidate.key}`);
  keys.add(candidate.key);
  if (!(candidate.severity in severityRank)) violations.push(`invalid severity for ${candidate.key ?? '<unknown>'}`);
  for (const field of ['lines', 'constructorDependencies', 'publicMethods']) {
    if (!Number.isInteger(candidate[field]) || candidate[field] < 0) {
      violations.push(`${candidate.key ?? '<unknown>'}: ${field} must be a non-negative integer`);
    }
  }
}

console.log(`Backend decomposition baseline: ${baseline.status}`);
console.log(`Approved candidates: ${(baseline.approvedCandidates ?? []).length}`);
console.log(`Baseline violations: ${violations.length}`);
for (const violation of violations) console.error(`- ${violation}`);

if (violations.length) process.exitCode = 1;
