import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const layoutPath = path.join(appRoot, 'layout.tsx');
const integrityPath = path.join(appRoot, 'admin-layout-integrity.css');
const sharedUiPath = path.join(appRoot, '(admin)', '_components', 'admin-ui.tsx');

test('layout integrity is the final Admin stylesheet authority', async () => {
  const layout = await fs.readFile(layoutPath, 'utf8');
  const closureImport = layout.indexOf("import './admin-pr2-ui-closure.css';");
  const integrityImport = layout.indexOf("import './admin-layout-integrity.css';");
  const runtimeImport = layout.indexOf("import { AdminMobileDrawerController }");

  assert.ok(closureImport >= 0, 'professional UI closure must remain loaded');
  assert.ok(integrityImport > closureImport, 'layout integrity must load after every earlier Admin stylesheet');
  assert.ok(runtimeImport > integrityImport, 'layout integrity must be the final stylesheet import');
});

test('layout integrity remains Admin-only', async () => {
  const css = await fs.readFile(integrityPath, 'utf8');

  assert.match(css, /body\[data-app-surface='admin'\]/);
  assert.doesNotMatch(css, /body\[data-app-surface=['"]member['"]\]/i);
  assert.doesNotMatch(css, /(^|[\s,{])\.member-/im);
  assert.doesNotMatch(css, /data-member-/i);
  assert.doesNotMatch(css, /#member-/i);
});

test('normal Admin text cannot collapse to one Thai character per line', async () => {
  const [css, sharedUi] = await Promise.all([
    fs.readFile(integrityPath, 'utf8'),
    fs.readFile(sharedUiPath, 'utf8'),
  ]);

  assert.match(sharedUi, /safeTextContainerStyle/);
  assert.match(css, /writing-mode:\s*horizontal-tb\s*!important/);
  assert.match(css, /word-break:\s*normal\s*!important/);
  assert.match(css, /overflow-wrap:\s*break-word\s*!important/);
  assert.match(css, /\.admin-ui-page__copy/);
  assert.match(css, /\.admin-ui-card__copy/);
  assert.match(css, /\.admin-confirm-dialog__copy/);
  assert.match(css, /code,[\s\S]*pre,[\s\S]*overflow-wrap:\s*anywhere\s*!important/);
});

test('all shared Admin page structures are container-aware', async () => {
  const css = await fs.readFile(integrityPath, 'utf8');

  const requiredContracts = [
    'container-name: admin-page',
    'container-type: inline-size',
    '@container admin-page (max-width: 1180px)',
    '@container admin-page (max-width: 900px)',
    '@container (max-width: 620px)',
    '.admin-ui-page__head',
    '.admin-ui-card__head',
    '.admin-ui-grid',
    '.admin-ui-metric-grid',
    '.admin-ui-toolbar',
    '.admin-ui-filter-bar__controls',
    '.admin-data-table__toolbar',
    '.admin-data-table__scroll',
    '.admin-ui-empty',
  ];

  for (const contract of requiredContracts) {
    assert.ok(css.includes(contract), `missing cross-page layout contract: ${contract}`);
  }
});

test('known data-heavy Admin grids have safe collapse ownership', async () => {
  const css = await fs.readFile(integrityPath, 'utf8');

  const knownRiskSelectors = [
    '.admin-wallet-history__summary',
    '.admin-wallet-detail__stats',
    '.admin-reconciliation-center__stats',
    '.admin-wallet-statement__stats',
    '.admin-wallet-analytics__stats',
    '.admin-wallet-analytics__hero',
    '.admin-member-insights__summary',
    '.admin-directory-grid',
    '.admin-risk-operations__grid',
    '.admin-risk-operations__flow',
    '.admin-promotion-operations__grid',
    '.admin-promotion-ops__grid',
    '.admin-dashboard__sections',
    '.admin-kpi-groups',
    '.admin-support-layout',
    '.admin-settings-layout',
    '.admin-security-layout',
    '.admin-reports-layout',
  ];

  for (const selector of knownRiskSelectors) {
    assert.ok(css.includes(selector), `missing known high-risk layout selector: ${selector}`);
  }

  assert.match(css, /repeat\(auto-fit,\s*minmax\(min\(/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/);
});

test('tables own horizontal scrolling instead of the whole page', async () => {
  const css = await fs.readFile(integrityPath, 'utf8');

  assert.match(css, /\.admin-content-shell\s*\{[\s\S]*overflow-x:\s*clip\s*!important/);
  assert.match(css, /\.admin-data-table__scroll/);
  assert.match(css, /overflow-x:\s*auto\s*!important/);
  assert.match(css, /overscroll-behavior-inline:\s*contain/);
});
