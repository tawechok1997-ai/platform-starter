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
const p5Start = worklist.indexOf('# P5 —');
const p6Start = worklist.indexOf('# P6 —');
const p5 = p5Start >= 0 && p6Start > p5Start ? worklist.slice(p5Start, p6Start) : '';
const failures = [];

for (const heading of ['## Query และ cache', '## Storage security', '## Tests และ CI']) {
  if (!p5.includes(heading)) failures.push(`master worklist missing ${heading}`);
}

const unchecked = [...p5.matchAll(/^- \[ \]/gm)].length;
if (unchecked > 0) failures.push(`P5 still contains ${unchecked} unchecked code items`);

const requiredScripts = [
  'audit:p5-closure',
  'audit:master-worklist',
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
console.log(`  unchecked code items: ${unchecked}`);
console.log(`  required scripts: ${requiredScripts.length}`);
console.log(`  workflow markers: ${workflowMarkers.length}`);
console.log(`  failures: ${failures.length}`);

if (failures.length) {
  console.error('\nP5 closure violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
