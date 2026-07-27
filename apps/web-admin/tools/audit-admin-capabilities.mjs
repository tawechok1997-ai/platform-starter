import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { tsImport } from 'tsx/esm/api';

const REPO_ROOT = process.cwd();
const ADMIN_ROOT = join(REPO_ROOT, 'apps', 'web-admin', 'app', '(admin)');
const WEB_ADMIN_ROOT = join(REPO_ROOT, 'apps', 'web-admin');
const OUTPUT_JSON = join(REPO_ROOT, 'docs', 'admin-functional-audit.generated.json');
const OUTPUT_MD = join(REPO_ROOT, 'docs', 'admin-functional-audit.generated.md');
const SAFE_SELF_SERVICE_ROUTES = new Set(['/dashboard', '/operations', '/profile', '/security']);
const INFORMATIONAL_ROUTES = new Set(['/provider-adapters', '/risk-operations']);
const NAVIGATION_HUB_ROUTES = new Set(['/settings']);
const KNOWN_PARTIAL_FINDINGS = new Set(['/money-ops:placeholder-message']);
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const SHARED_INFRASTRUCTURE_FRAGMENTS = ['/app/admin-api', '/app/(admin)/_components/', '/src/features/admin-modernization/'];

const { requiredPermissionsForPath } = await tsImport('../app/(admin)/admin-nav.ts', import.meta.url);

function normalize(path) {
  return path.split(sep).join('/');
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function routeFromPage(file) {
  const rel = normalize(relative(ADMIN_ROOT, file)).replace(/\/page\.tsx$/, '');
  return rel ? `/${rel.replace(/\[([^/]+)\]/g, ':$1')}` : '/';
}

async function resolveImportPath(fromFile, request) {
  if (!request.startsWith('.')) return null;
  const base = resolve(dirname(fromFile), request);
  const candidates = [base, ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`), ...SOURCE_EXTENSIONS.map((extension) => join(base, `index${extension}`))];
  for (const candidate of candidates) {
    const normalized = normalize(candidate);
    if (!normalized.startsWith(normalize(WEB_ADMIN_ROOT))) continue;
    if (SHARED_INFRASTRUCTURE_FRAGMENTS.some((fragment) => normalized.includes(fragment))) continue;
    try {
      const source = await readFile(candidate, 'utf8');
      return { path: candidate, source };
    } catch {
      // Try the next supported source extension.
    }
  }
  return null;
}

async function collectSource(entryFile, visited = new Set(), depth = 0) {
  if (visited.has(entryFile) || depth > 4) return '';
  visited.add(entryFile);
  let source = '';
  try {
    source = await readFile(entryFile, 'utf8');
  } catch {
    return '';
  }
  const chunks = [`\n/* ${normalize(relative(REPO_ROOT, entryFile))} */\n${source}`];
  const imports = [...source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map((match) => match[1]);
  for (const request of imports) {
    const imported = await resolveImportPath(entryFile, request);
    if (imported) chunks.push(await collectSource(imported.path, visited, depth + 1));
  }
  return chunks.join('\n');
}

const pageFiles = (await walk(ADMIN_ROOT)).filter((file) => file.endsWith(`${sep}page.tsx`)).sort();
const routes = [];

for (const pageFile of pageFiles) {
  const route = routeFromPage(pageFile);
  const source = await collectSource(pageFile);
  const permissions = [...requiredPermissionsForPath(route)];
  const safeSelfService = SAFE_SELF_SERVICE_ROUTES.has(route) || [...SAFE_SELF_SERVICE_ROUTES].some((href) => route.startsWith(`${href}/`));
  const apiEndpoints = [...new Set([...source.matchAll(/['"`]((?:\/api)?\/admin\/[A-Za-z0-9_?&=:\-/${}.]+)['"`]/g)].map((match) => match[1]))].sort();
  const mutationMethods = [...new Set([...source.matchAll(/method\s*:\s*['"](POST|PATCH|PUT|DELETE)['"]/gi)].map((match) => match[1].toUpperCase()))].sort();
  const hasApiContract = /adminApiFetch\s*\(|apiClient\.|\/admin\//.test(source);
  const hasInteractiveAction = /<form\b|<button\b|onSubmit\s*=|onClick\s*=/.test(source);
  const hasLocaleContract = /useAdminLocale|AdminLocale|localizedNav|locale\s*===|copy\s*\[\s*locale\s*\]/.test(source);
  const hasLoadingState = /\bloading\b|กำลังโหลด|Loading/.test(source);
  const hasEmptyState = /AdminEmpty|emptyState|ไม่มีข้อมูล|No data|length\s*===\s*0/.test(source);
  const hasErrorState = /\berror\b|AdminNotice[^\n]*danger|โหลด.*ไม่สำเร็จ|could not be loaded|catch\s*\(/i.test(source);
  const hasUiPermissionCheck = /permissions|hasPermission|can[A-Z]|PermissionGate|requiredPermissionsForPath/.test(source);
  const deadLink = /href\s*=\s*['"]#['"]|javascript\s*:\s*void/i.test(source);
  const alertStub = /\balert\s*\(/.test(source);
  const literalDisabled = /<button[^>]*(?:\sdisabled(?:\s|>|=\{true\}))/i.test(source);
  const placeholderMessage = /not implemented|coming soon|ยังไม่พร้อมใช้งาน|ยังไม่รองรับ|เร็ว\s*ๆ\s*นี้|>\s*TODO\s*</i.test(source);
  const localSourceFiles = (source.match(/^\/\* apps\/web-admin\//gm) ?? []).length;
  const routeMode = INFORMATIONAL_ROUTES.has(route)
    ? 'informational'
    : NAVIGATION_HUB_ROUTES.has(route)
      ? 'navigation-hub'
      : hasApiContract
        ? 'api-backed'
        : 'client-only';

  const findings = [];
  if (!safeSelfService && permissions.length === 0) findings.push('missing-route-permission');
  if (deadLink) findings.push('dead-link');
  if (alertStub) findings.push('alert-stub');
  if (literalDisabled) findings.push('literal-disabled-control');
  if (placeholderMessage) findings.push('placeholder-message');
  if (mutationMethods.length > 0 && !hasUiPermissionCheck) findings.push('mutation-without-visible-ui-permission-check');
  if (!hasLocaleContract) findings.push('missing-explicit-locale-contract');
  if (hasApiContract && !hasLoadingState) findings.push('missing-visible-loading-state');
  if (hasApiContract && !hasEmptyState) findings.push('missing-visible-empty-state');
  if (hasApiContract && !hasErrorState) findings.push('missing-visible-error-state');
  if (!hasApiContract && hasInteractiveAction && routeMode === 'client-only' && route !== '/profile' && route !== '/security') findings.push('interactive-route-without-detected-admin-api');

  routes.push({
    route,
    source: normalize(relative(REPO_ROOT, pageFile)),
    permissions,
    safeSelfService,
    routeMode,
    localSourceFiles,
    apiEndpoints,
    mutationMethods,
    findings,
  });
}

const hardFindingNames = new Set(['missing-route-permission', 'dead-link', 'alert-stub', 'literal-disabled-control', 'placeholder-message']);
const allFindings = routes.flatMap((route) => route.findings.map((finding) => ({ route: route.route, finding })));
const partialFindings = allFindings.filter((item) => KNOWN_PARTIAL_FINDINGS.has(`${item.route}:${item.finding}`));
const hardFindings = allFindings.filter((item) => hardFindingNames.has(item.finding) && !KNOWN_PARTIAL_FINDINGS.has(`${item.route}:${item.finding}`));
const warningFindings = allFindings.filter((item) => !hardFindingNames.has(item.finding));
const summary = {
  totalRoutes: routes.length,
  routesWithExplicitPermissions: routes.filter((route) => route.permissions.length > 0).length,
  safeSelfServiceRoutes: routes.filter((route) => route.safeSelfService).length,
  apiBackedRoutes: routes.filter((route) => route.routeMode === 'api-backed').length,
  informationalRoutes: routes.filter((route) => route.routeMode === 'informational').length,
  navigationHubRoutes: routes.filter((route) => route.routeMode === 'navigation-hub').length,
  routesWithDetectedMutations: routes.filter((route) => route.mutationMethods.length > 0).length,
  hardFindingCount: hardFindings.length,
  partialFindingCount: partialFindings.length,
  warningFindingCount: warningFindings.length,
};

const report = {
  generatedAt: new Date().toISOString(),
  summary,
  hardFindings,
  partialFindings,
  warningFindings,
  routes,
};

await mkdir(dirname(OUTPUT_JSON), { recursive: true });
await writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`);

const lines = [
  '# Admin functional capability audit',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `- Routes: **${summary.totalRoutes}**`,
  `- Explicitly permissioned: **${summary.routesWithExplicitPermissions}**`,
  `- Safe self-service routes: **${summary.safeSelfServiceRoutes}**`,
  `- API-backed routes: **${summary.apiBackedRoutes}**`,
  `- Informational routes: **${summary.informationalRoutes}**`,
  `- Navigation hubs: **${summary.navigationHubRoutes}**`,
  `- Routes with detected mutations: **${summary.routesWithDetectedMutations}**`,
  `- Hard findings: **${summary.hardFindingCount}**`,
  `- Known partial findings: **${summary.partialFindingCount}**`,
  `- Review warnings: **${summary.warningFindingCount}**`,
  '',
  '## Hard findings',
  '',
  ...(hardFindings.length ? hardFindings.map((item) => `- \`${item.route}\`: ${item.finding}`) : ['None.']),
  '',
  '## Known partial functionality',
  '',
  ...(partialFindings.length ? partialFindings.map((item) => `- \`${item.route}\`: ${item.finding}`) : ['None.']),
  '',
  '## Review warnings',
  '',
  ...(warningFindings.length ? warningFindings.map((item) => `- \`${item.route}\`: ${item.finding}`) : ['None.']),
  '',
];
await writeFile(OUTPUT_MD, `${lines.join('\n')}\n`);

console.log(JSON.stringify(summary, null, 2));
if (hardFindings.length > 0) process.exitCode = 1;
