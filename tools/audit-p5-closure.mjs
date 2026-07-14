import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const worklistPath = join(root, 'docs', 'master-project-worklist.md');
const packagePath = join(root, 'package.json');
const workflowPath = join(root, '.github', 'workflows', 'build.yml');

const [worklist, packageRaw, workflow] = await Promise.all([
  readFile(worklistPath, 'utf8'),
  readFile(packagePath, 'utf8'),
  readFile(workflowPath, 'utf8'),
]);

const pkg = JSON.parse(packageRaw);
const p5Start = worklist.indexOf('# P5 — Performance, storage และ CI');
const p5End = worklist.indexOf('\n---', p5Start);
const p5 = p5Start >= 0 ? worklist.slice(p5Start, p5End > p5Start ? p5End : undefined) : '';
const failures = [];

for (const item of ['M-022', 'M-023', 'M-024', 'M-025', 'M-026']) {
  if (!p5.includes(`## ${item}`)) failures.push(`master worklist missing ${item}`);
}

if (/สถานะ:\s*(?:🔴 TODO|🟡 PARTIAL)/.test(p5)) {
  failures.push('P5 still contains TODO or PARTIAL status');
}
if (/^- \[ \]/m.test(p5)) failures.push('P5 still contains unchecked checklist items');

const requiredScripts = [
  'audit:p5-closure',
  'typecheck:api',
  'typecheck:admin',
  'typecheck:member',
];
for (const script of requiredScripts) {
  if (!pkg.scripts?.[script]) failures.push(`package.json missing ${script}`);
}

const workflowMarkers = [
  'Typecheck API',
  'Typecheck Admin Web',
  'Typecheck Member Web',
  'Regression test summary',
  'GITHUB_STEP_SUMMARY',
];
for (const marker of workflowMarkers) {
  if (!workflow.includes(marker)) failures.push(`build.yml missing ${marker}`);
}

console.log('P5 closure audit');
console.log(`  workstreams: 5`);
console.log(`  required scripts: ${requiredScripts.length}`);
console.log(`  workflow markers: ${workflowMarkers.length}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nP5 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
