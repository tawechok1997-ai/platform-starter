import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const APP_ROOT = join(ROOT, 'apps', 'web-member', 'app');
const MATRIX_PATH = join(ROOT, 'docs', 'MEMBER_ROUTE_MATRIX.md');
const REQUIRED_STATES = new Set([
  'loading',
  'empty',
  'partial-failure',
  'error',
  'offline',
  'stale',
  'maintenance',
  'success',
  'retry',
  'session-expired',
]);
const PRIORITIES = new Set(['P0', 'P1', 'P2', 'P3']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile() && entry.name === 'page.tsx') files.push(path);
  }
  return files;
}

function normalize(path) {
  return relative(ROOT, path).split(sep).join('/');
}

function routeFromPage(path) {
  const segments = relative(APP_ROOT, path)
    .split(sep)
    .slice(0, -1)
    .filter((segment) => !/^\(.+\)$/.test(segment));
  return segments.length ? `/${segments.join('/')}` : '/';
}

function unquote(value) {
  const match = value.match(/^`(.+)`$/);
  return match ? match[1] : value;
}

function stateSet(value) {
  if (value === '—') return new Set();
  return new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function matrixRows(markdown) {
  return markdown
    .split('\n')
    .filter((line) => /^\|\s*`\//.test(line))
    .map((line, index) => {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());
      if (cells.length !== 14) throw new Error(`Matrix row ${index + 1} has ${cells.length} columns; expected 14`);
      const [
        route,
        page,
        priority,
        frontendOwner,
        apiOwner,
        milestone,
        auth,
        apis,
        flags,
        deepLinks,
        covered,
        gaps,
        notApplicable,
        evidence,
      ] = cells;
      return {
        route: unquote(route),
        page: unquote(page),
        priority,
        frontendOwner,
        apiOwner,
        milestone,
        auth,
        apis,
        flags,
        deepLinks,
        covered: stateSet(covered),
        gaps: stateSet(gaps),
        notApplicable: stateSet(notApplicable),
        evidence,
      };
    });
}

function addError(errors, condition, message) {
  if (condition) errors.push(message);
}

const [pageFiles, markdown] = await Promise.all([walk(APP_ROOT), readFile(MATRIX_PATH, 'utf8')]);
const sourceRoutes = new Map(pageFiles.map((path) => [routeFromPage(path), normalize(path)]));
const rows = matrixRows(markdown);
const matrixRoutes = new Map();
const errors = [];

for (const row of rows) {
  addError(errors, matrixRoutes.has(row.route), `Duplicate matrix route: ${row.route}`);
  matrixRoutes.set(row.route, row);
  addError(errors, !PRIORITIES.has(row.priority), `${row.route}: invalid priority ${row.priority}`);
  addError(errors, !row.frontendOwner || row.frontendOwner === '—', `${row.route}: missing frontend owner`);
  addError(errors, !row.apiOwner, `${row.route}: missing API owner/readiness`);
  addError(errors, !row.milestone, `${row.route}: missing milestone`);
  addError(errors, !row.auth, `${row.route}: missing auth policy`);
  addError(errors, !row.apis, `${row.route}: missing API inventory`);
  addError(errors, !row.flags, `${row.route}: missing flag/settings inventory`);
  addError(errors, !row.deepLinks, `${row.route}: missing deep-link inventory`);
  addError(errors, !row.evidence, `${row.route}: missing evidence`);

  const allStates = [...row.covered, ...row.gaps, ...row.notApplicable];
  const uniqueStates = new Set(allStates);
  addError(
    errors,
    uniqueStates.size !== allStates.length,
    `${row.route}: a state appears in more than one coverage column`,
  );
  for (const state of uniqueStates)
    addError(errors, !REQUIRED_STATES.has(state), `${row.route}: unknown state ${state}`);
  for (const state of REQUIRED_STATES)
    addError(errors, !uniqueStates.has(state), `${row.route}: state ${state} is not classified`);

  const expectedPage = sourceRoutes.get(row.route);
  addError(errors, !expectedPage, `${row.route}: matrix route has no page.tsx`);
  addError(
    errors,
    Boolean(expectedPage) && expectedPage !== row.page,
    `${row.route}: expected page ${expectedPage}, found ${row.page}`,
  );
}

for (const [route, page] of sourceRoutes) {
  addError(errors, !matrixRoutes.has(route), `${route}: ${page} is missing from the matrix`);
}

console.log(`Member route matrix audit: ${sourceRoutes.size} page routes, ${rows.length} matrix rows`);
console.log(`  P0/P1 routes: ${rows.filter((row) => row.priority === 'P0' || row.priority === 'P1').length}`);
console.log(`  routes with known state gaps: ${rows.filter((row) => row.gaps.size > 0).length}`);
console.log(`  errors: ${errors.length}`);

if (errors.length) {
  console.error('\nMember route matrix audit failures:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
}
