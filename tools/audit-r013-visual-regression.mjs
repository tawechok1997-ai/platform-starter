import fs from 'node:fs';

const config = fs.readFileSync('playwright.visual.config.ts', 'utf8');
const spec = fs.readFileSync('tests/e2e-visual/r013-auth-surfaces.spec.ts', 'utf8');
const workflow = fs.readFileSync('.github/workflows/r013-visual-regression.yml', 'utf8');
const workflowLines = workflow.split(/\r?\n/).map((line) => line.trim());

const checks = [
  ['six named viewport projects', ['360x800', '390x844', '430x932', '768x1024', '1024x768', '1440x900'].every((name) => config.includes(name))],
  ['admin and member surfaces', spec.includes('admin-login') && spec.includes('member-login')],
  ['visual screenshot comparison', spec.includes('toHaveScreenshot')],
  ['runtime screenshots', spec.includes('page.png') && spec.includes('page.screenshot')],
  ['console evidence', spec.includes('console.json') && spec.includes("page.on('console'")],
  ['network evidence', spec.includes('network.json') && spec.includes("page.on('request'") && spec.includes("page.on('response'")],
  ['trace retention', config.includes("trace: 'retain-on-failure'")],
  ['html report', config.includes('html-report')],
  ['baseline command', workflowLines.includes('run: pnpm test:e2e:visual:update')],
  ['compare command', workflowLines.includes('run: pnpm test:e2e:visual')],
  ['artifact upload always', workflowLines.includes('if: always()') && workflow.includes('r013-visual-regression-evidence')],
  ['artifact includes screenshots', workflow.includes('tests/e2e-visual/__screenshots__/**')],
  ['artifact includes runtime evidence', workflow.includes('artifacts/r013-visual/**')],
];

const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  passed: checks.every(([, passed]) => passed),
  checks: checks.map(([name, passed]) => ({ name, passed })),
};
fs.mkdirSync('artifacts/r013-visual', { recursive: true });
fs.writeFileSync('artifacts/r013-visual/contract.json', `${JSON.stringify(result, null, 2)}\n`);

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (failed.length) process.exit(1);
console.log(`R-013 visual regression contract passed (${checks.length} checks).`);
