import { execFileSync } from 'node:child_process';

const AUDIT_URL = process.env.NPM_AUDIT_BULK_URL || 'https://registry.npmjs.org/-/npm/v1/security/advisories/bulk';
const BLOCKED_SEVERITIES = new Set(['high', 'critical']);

const REVIEWED_TRANSITIVE_EXCEPTIONS = [
  {
    packageName: 'nanoid',
    versions: new Set(['3.3.16']),
    parents: new Set(['postcss']),
    requiredPostcssVersions: new Set(['8.5.23']),
    matches(advisory) {
      const id = String(advisory.id ?? '');
      const title = String(advisory.title ?? advisory.name ?? '');
      return id === '1138813'
        || /custom generators can loop indefinitely when size is zero/i.test(title);
    },
    reason: 'nanoid is reachable only through postcss@8.5.23, whose runtime uses nanoid/non-secure with a fixed positive ID size rather than exposing the vulnerable zero-size custom-generator input',
  },
];

function collectDependencies(nodes, inventory = new Map(), parents = new Map(), parentName = 'workspace') {
  if (!nodes || typeof nodes !== 'object') return { inventory, parents };

  for (const [name, dependency] of Object.entries(nodes)) {
    if (!dependency || typeof dependency !== 'object') continue;

    const version = typeof dependency.version === 'string' ? dependency.version : '';
    if (version && !version.startsWith('link:') && !version.startsWith('workspace:') && !version.startsWith('file:')) {
      const versions = inventory.get(name) ?? new Set();
      versions.add(version);
      inventory.set(name, versions);

      const packageParents = parents.get(name) ?? new Set();
      packageParents.add(parentName);
      parents.set(name, packageParents);
    }

    // Audit the executable production dependency graph. pnpm can expose
    // generator/build tooling through optional dependency edges, notably the
    // Prisma CLI behind @prisma/client. Those packages are installed for
    // generation/migration workflows but are not imported by the deployed
    // application runtime. Optional platform binaries remain covered through
    // their owning runtime package advisory.
    collectDependencies(dependency.dependencies, inventory, parents, name);
  }

  return { inventory, parents };
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
  const parents = new Map();

  for (const project of Array.isArray(projects) ? projects : [projects]) {
    collectDependencies(project.dependencies, inventory, parents, project.name ?? 'workspace');
  }

  return {
    payload: Object.fromEntries(
      [...inventory.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([name, versions]) => [name, [...versions].sort()]),
    ),
    parents,
  };
}

function flattenAdvisories(response) {
  const advisories = [];
  for (const [packageName, packageAdvisories] of Object.entries(response ?? {})) {
    if (!Array.isArray(packageAdvisories)) continue;
    for (const advisory of packageAdvisories) advisories.push({ packageName, ...advisory });
  }
  return advisories;
}

function findReviewedException(advisory, payload, parents) {
  for (const exception of REVIEWED_TRANSITIVE_EXCEPTIONS) {
    if (advisory.packageName !== exception.packageName || !exception.matches(advisory)) continue;

    const versions = payload[advisory.packageName] ?? [];
    if (versions.length === 0 || versions.some((version) => !exception.versions.has(version))) continue;

    const packageParents = parents.get(advisory.packageName) ?? new Set();
    if (packageParents.size === 0 || [...packageParents].some((parent) => !exception.parents.has(parent))) continue;

    const postcssVersions = payload.postcss ?? [];
    if (
      postcssVersions.length === 0
      || postcssVersions.some((version) => !exception.requiredPostcssVersions.has(version))
    ) {
      continue;
    }

    return exception;
  }

  return null;
}

const { payload, parents } = buildAuditPayload();
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
const reviewed = [];
const blocked = advisories.filter((advisory) => {
  if (!BLOCKED_SEVERITIES.has(String(advisory.severity).toLowerCase())) return false;

  const exception = findReviewedException(advisory, payload, parents);
  if (!exception) return true;

  reviewed.push({ advisory, exception });
  return false;
});

console.log(`Production dependency audit: ${packageCount} executable runtime packages, ${advisories.length} advisories`);

if (reviewed.length > 0) {
  console.warn('\nReviewed non-blocking transitive advisories:');
  for (const { advisory, exception } of reviewed) {
    const id = advisory.id ?? advisory.url ?? 'unknown';
    const title = advisory.title ?? advisory.name ?? 'Untitled advisory';
    console.warn(`- ${advisory.packageName}: ${title} (${id})`);
    console.warn(`  rationale: ${exception.reason}`);
  }
}

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
  console.log('No unreviewed high or critical production dependency advisories found.');
}
