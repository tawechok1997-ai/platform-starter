import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CONTROLLERS = path.join(ROOT, 'apps/api/src');
const REGISTRY = path.join(ROOT, 'apps/api/src/common/security/domain-authorization-policy.ts');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.name.endsWith('.controller.ts')) files.push(full);
  }
  return files;
}

const registry = await readFile(REGISTRY, 'utf8');
const requiredDomains = ['finance', 'admin_lifecycle', 'kyc_risk', 'support_notifications', 'cms_reports'];
const missingDomains = requiredDomains.filter((domain) => !registry.includes(`'${domain}'`));
const prefixes = [...registry.matchAll(/permissionPrefixes:\s*\[([^\]]+)\]/g)]
  .flatMap((match) => [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]));

const permissions = [];
for (const file of await walk(CONTROLLERS)) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/@RequirePermission\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    permissions.push({ file: path.relative(ROOT, file), permission: match[1] });
  }
}

const unmapped = permissions.filter(({ permission }) =>
  !prefixes.some((prefix) => permission.toLowerCase().startsWith(prefix)),
);
const checks = [
  ['all authorization domains declared', missingDomains.length === 0],
  ['domain registry owns routed permission prefixes', prefixes.length >= 10],
  ['admin routes expose permission metadata', permissions.length > 0],
  ['all routed permissions map to a domain', unmapped.length === 0],
  ['registry authorizes through shared requirePermission', /return requirePermission\(actor, permission\)/.test(registry)],
  ['cross-domain permission mismatch is denied', /resolvedDomain !== domain/.test(registry)],
];

const failed = checks.filter(([, passed]) => !passed).map(([name]) => name);
if (unmapped.length) {
  console.error('Unmapped route permissions:');
  for (const item of unmapped) console.error(`- ${item.file}: ${item.permission}`);
}
if (failed.length) {
  console.error('R-011 domain authorization audit failed:');
  for (const name of failed) console.error(`- ${name}`);
  process.exit(1);
}
console.log(`R-011 domain authorization audit passed (${permissions.length} routed permissions, ${prefixes.length} prefixes).`);
