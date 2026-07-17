import { readFile } from 'node:fs/promises';

const path = 'docs/maintenance/repository-cleanup-baseline.json';
const baseline = JSON.parse(await readFile(path, 'utf8'));
const violations = [];
const allowedStatuses = new Set(['review-required', 'approved']);

if (baseline.version !== 1) violations.push('version must be 1');
if (!allowedStatuses.has(baseline.status)) violations.push('status must be review-required or approved');
if (!Array.isArray(baseline.approvedCandidates)) violations.push('approvedCandidates must be an array');
if (baseline.status === 'approved' && !baseline.capturedAt) violations.push('approved baseline requires capturedAt');

const candidates = Array.isArray(baseline.approvedCandidates) ? baseline.approvedCandidates : [];
const seen = new Set();
for (const [index, candidate] of candidates.entries()) {
  if (!candidate || typeof candidate !== 'object') {
    violations.push(`approvedCandidates[${index}] must be an object`);
    continue;
  }
  if (typeof candidate.path !== 'string' || !candidate.path.trim()) violations.push(`approvedCandidates[${index}].path is required`);
  if (seen.has(candidate.path)) violations.push(`duplicate candidate path: ${candidate.path}`);
  seen.add(candidate.path);
  if (!['keep', 'move', 'delete', 'generated-ignore'].includes(candidate.disposition)) {
    violations.push(`approvedCandidates[${index}].disposition is invalid`);
  }
  if (typeof candidate.owner !== 'string' || !candidate.owner.trim()) violations.push(`approvedCandidates[${index}].owner is required`);
  if (candidate.disposition === 'delete' && !candidate.evidence) violations.push(`delete candidate requires evidence: ${candidate.path}`);
}

console.log(`Cleanup baseline status: ${baseline.status}`);
console.log(`Approved cleanup candidates: ${candidates.length}`);
console.log(`Baseline violations: ${violations.length}`);
for (const violation of violations) console.error(`- ${violation}`);
if (violations.length) process.exitCode = 1;
