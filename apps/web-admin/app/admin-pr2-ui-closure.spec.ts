import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const adminRoot = path.join(appRoot, '(admin)');
const layoutPath = path.join(appRoot, 'layout.tsx');
const closureCssPath = path.join(appRoot, 'admin-pr2-ui-closure.css');

const criticalRoutes = [
  '/dashboard',
  '/operations',
  '/access',
  '/admin-accounts',
  '/admin-roles',
  '/topups',
  '/withdrawals',
  '/risk-alerts',
  '/support-center',
  '/settings',
  '/settings/theme',
  '/security',
] as const;

test('PR-2 UI authority loads after every earlier Admin stylesheet', async () => {
  const layout = await fs.readFile(layoutPath, 'utf8');
  const contentInsetImport = layout.indexOf("import './admin-content-insets.css';");
  const closureImport = layout.indexOf("import './admin-pr2-ui-closure.css';");
  const runtimeImport = layout.indexOf("import { AdminMobileDrawerController }");

  assert.ok(contentInsetImport >= 0, 'content-inset authority must remain imported');
  assert.ok(closureImport > contentInsetImport, 'PR-2 authority must load after content insets');
  assert.ok(runtimeImport > closureImport, 'PR-2 authority must be the final stylesheet import');
});

test('PR-2 authority closes shell, metric, table, theme, access, and focus contracts', async () => {
  const css = await fs.readFile(closureCssPath, 'utf8');

  const requiredContracts = [
    '.admin-main-shell',
    '.admin-topbar-actions',
    '.admin-ui-metric-grid',
    '.admin-data-table__scroll',
    '.admin-access-denied',
    "html[data-admin-theme='light']",
    "html[data-admin-contrast='high']",
    ':focus-visible',
    '@media (max-width: 430px)',
    'repeat(2, minmax(0, 1fr))',
    '@media (max-width: 339px)',
    'display: table !important',
    'overscroll-behavior-inline: contain',
    'min-height: var(--admin-pr2-touch-target)',
  ];

  for (const contract of requiredContracts) {
    assert.ok(css.includes(contract), `missing PR-2 UI contract: ${contract}`);
  }

  const twoColumnRule = css.indexOf('@media (max-width: 430px)');
  const oneColumnRule = css.indexOf('@media (max-width: 339px)');
  assert.ok(twoColumnRule >= 0 && oneColumnRule > twoColumnRule, 'mobile metrics must remain two columns until ultra-narrow width');
});

test('Admin route and interaction inventory remains complete and free of placeholder actions', async () => {
  const files = await walk(adminRoot);
  const pageFiles = files.filter((file) => path.basename(file) === 'page.tsx');
  const sourceFiles = files.filter((file) => /\.(?:ts|tsx)$/.test(file) && !file.endsWith('.spec.ts'));
  const routes = new Set(pageFiles.map(routeFromPage));

  assert.ok(pageFiles.length >= 80, `expected a complete Admin route inventory, found ${pageFiles.length}`);
  for (const route of criticalRoutes) {
    assert.ok(routes.has(route), `critical Admin route missing from inventory: ${route}`);
  }

  let interactionCount = 0;
  const unsafeActions: string[] = [];
  for (const file of sourceFiles) {
    const source = await fs.readFile(file, 'utf8');
    interactionCount += (source.match(/<(?:button|a)\b/g) ?? []).length;
    interactionCount += (source.match(/\bAdmin(?:Button|IconButton|LinkButton)\b/g) ?? []).length;

    if (/\bhref\s*=\s*(?:{\s*)?["'`]#["'`]/.test(source)) unsafeActions.push(`${relative(file)}: href="#"`);
    if (/\b(?:href|action|formAction)\s*=\s*(?:{\s*)?["'`]javascript\s*:/i.test(source)) {
      unsafeActions.push(`${relative(file)}: javascript URL`);
    }
  }

  assert.ok(interactionCount >= 100, `interaction inventory is unexpectedly small: ${interactionCount}`);
  assert.deepEqual(unsafeActions, [], `placeholder or unsafe actions found:\n${unsafeActions.join('\n')}`);

  console.log(`Admin PR-2 inventory: routes=${pageFiles.length}, sourceFiles=${sourceFiles.length}, interactions=${interactionCount}`);
});

async function walk(directory: string, files: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute, files);
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function routeFromPage(file: string) {
  const relative = path.relative(adminRoot, path.dirname(file));
  const segments = relative
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .map((segment) => {
      if (segment.startsWith('[[...') && segment.endsWith(']]')) return `:${segment.slice(5, -2)}*?`;
      if (segment.startsWith('[...') && segment.endsWith(']')) return `:${segment.slice(4, -1)}*`;
      if (segment.startsWith('[') && segment.endsWith(']')) return `:${segment.slice(1, -1)}`;
      return segment;
    });
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/';
}

function relative(file: string) {
  return path.relative(process.cwd(), file).split(path.sep).join('/');
}
