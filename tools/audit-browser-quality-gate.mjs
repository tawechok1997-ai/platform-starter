import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const fixturePath = join(root, 'tests', 'fixtures', 'quality-test.ts');
const workflowPath = join(root, '.github', 'workflows', 'r006-quality.yml');

try {
  await access(fixturePath);
  const fixture = await readFile(fixturePath, 'utf8');
  const requiredSignals = [
    "page.on('console'",
    "page.on('pageerror'",
    "page.on('requestfailed'",
    "page.on('response'",
    'browser-failures.json',
  ];
  for (const signal of requiredSignals) {
    if (!fixture.includes(signal)) failures.push(`tests/fixtures/quality-test.ts: missing ${signal}`);
  }
} catch {
  failures.push('tests/fixtures/quality-test.ts: missing browser quality fixture');
}

try {
  const workflow = await readFile(workflowPath, 'utf8');
  if (!workflow.includes('test-results')) failures.push('r006-quality.yml: failure artifacts do not include test-results');
  if (!workflow.includes('playwright-report')) failures.push('r006-quality.yml: failure artifacts do not include playwright-report');
} catch {
  failures.push('.github/workflows/r006-quality.yml: missing workflow');
}

console.log(`Browser quality gate audit: ${failures.length} violations`);
if (failures.length) {
  console.error('\nBrowser quality gate violations:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
}
