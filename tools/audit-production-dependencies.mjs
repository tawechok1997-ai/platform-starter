import { execFileSync } from 'node:child_process';

const AUDIT_URL = process.env.NPM_AUDIT_BULK_URL || 'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk';
const BLOCKED_SEVERITIES = new Set(['high', 'critical']);

function collectDependencies(nodes, inventory = new Map()) {
  if (!nodes || typeof nodes !== 'object') return inventory;

  for (const [name, dependency] of Object.entries(nodes)) {
    if (!dependency || typeof dependency !== 'object') continue;

    const version = typeof dependency.version === 'string' ? dependency.version : '';
    if (version && !version.startsWith('link:') && !version.startsWith('workspace:') && !version.startsWith('file:')) {
      const versions = inventory.get(name) ?? new Set();
      versions.add(version);
      inventory.set(name, versions);
    }

    // Audit the executable production dependency graph. pnpm can expose
    // generator/build tooling through optional dependency edges, notably the
    // Prisma CLI behind @prisma/client. Those packages are installed for
    // generation/migration workflows but are not imported by the deployed
    // application runtime. Optional platform binaries remain covered through
    // their owning runtime package advisory.
    collectDependencies(dependency.dependencies, inventory);
  }

  return inventory;
}

function buildAuditPayload() {
  const raw = execFileSync(
    'pnpm',
    [
      '--filter',
      '@platform/api',
      '--filter',
      '@platform/web-admin',
      '--filter',
      '@platform/web-member',
      '--filter',
      '@platform/api-client',
      'list',
      '--prod',
      '--json',
      '--depth',
      'Infinity',
    ],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );

  const projects = JSON.parse(raw);
  const inventory = new Map();

  for (const project of Array.isArray(projects) ? projects : [projects]) {
    collectDependencies(project.dependencies, inventory);
  }

  return Object.fromEntries(
    [...inventory.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, versions]) => [name, [...versions].sort()]),
  );
}

function flattenAdvisories(response) {
  const advisories = [];
  for (const [packageName, packageAdvisories] of Object.entries(response ?? {})) {
    if (!Array.isArray(packageAdvisories)) continue;
    for (const advisory of packageAdvisories) advisories.push({ packageName, ...advisory });
  }
  return advisories;
}

const payload = buildAuditPayload();
const packageCount = Object.keys(payload).length;

if (packageCount === 0) {
  throw new Error('Production dependency inventory is empty; refusing to report a false clean audit');
}

const response = await fetch(AUDIT_URL, {
  method: 'POST',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'user-agent': 'platform-starter-security-audit/1.0',
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`npm bulk advisory endpoint returned ${response.status}: ${body.slice(0, 500)}`);
}

const advisories = flattenAdvisories(await response.json());
const blocked = advisories.filter((advisory) => BLOCKED_SEVERITIES.has(String(advisory.severity).toLowerCase()));

console.log(`Production dependency audit: ${packageCount} executable runtime packages, ${advisories.length} advisories`);

if (blocked.length > 0) {
  console.error('\nHigh or critical production dependency advisories:');
  for (const advisory of blocked) {
    const id = advisory.id ?? advisory.url ?? 'unknown';
    const title = advisory.title ?? advisory.name ?? 'Untitled advisory';
    const vulnerable = advisory.vulnerable_versions ?? advisory.range ?? 'unknown range';
    console.error(`- ${advisory.packageName}: ${title} [${advisory.severity}] (${id}; ${vulnerable})`);
  }
  process.exitCode = 1;
} else {
  console.log('No high or critical production dependency advisories found.');
}
