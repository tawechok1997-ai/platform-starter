const groups = [
  {
    name: 'deployed-environment',
    blocking: true,
    required: ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL'],
  },
  {
    name: 'seeded-credentials',
    blocking: true,
    required: [
      'P6_ADMIN_EMAIL',
      'P6_ADMIN_PASSWORD',
      'P6_READONLY_ADMIN_EMAIL',
      'P6_READONLY_ADMIN_PASSWORD',
      'P6_MEMBER_EMAIL',
      'P6_MEMBER_PASSWORD',
    ],
  },
  {
    name: 'vendor-uat',
    blocking: false,
    required: ['P6_PROVIDER_CODE', 'P6_PROVIDER_BASE_URL'],
    optional: ['P6_PROVIDER_API_KEY', 'P6_PROVIDER_SECRET', 'P6_PROVIDER_CALLBACK_URL'],
  },
];

const strict = process.argv.includes('--strict');
const json = process.argv.includes('--json');
const environment = normalizeEnvironment(process.env.P6_ENVIRONMENT);

const groupReports = groups.map((group) => {
  const missing = group.required.filter((name) => !hasValue(name));
  const present = group.required.filter(hasValue);
  const optionalPresent = (group.optional ?? []).filter(hasValue);
  const validationErrors = validateGroup(group.name, environment);
  const ready = missing.length === 0 && validationErrors.length === 0;
  return {
    name: group.name,
    blocking: group.blocking !== false,
    ready,
    status: ready ? 'ready' : group.blocking === false ? 'skipped' : 'blocked',
    required: group.required,
    present,
    missing,
    optionalPresent,
    validationErrors,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  strict,
  environment,
  groups: groupReports,
};

report.readyGroups = report.groups.filter((group) => group.ready).length;
report.totalGroups = report.groups.length;
report.blockingGroups = report.groups.filter((group) => group.blocking).length;
report.readyBlockingGroups = report.groups.filter((group) => group.blocking && group.ready).length;
report.optionalGroups = report.groups.filter((group) => !group.blocking).length;
report.ready = report.groups.filter((group) => group.blocking).every((group) => group.ready);

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('P6 external readiness');
  console.log(`  environment: ${environment}`);
  for (const group of report.groups) {
    const label = group.ready ? 'READY' : group.blocking ? 'BLOCKED' : 'SKIPPED';
    console.log(`  ${label} ${group.name}`);
    if (group.missing.length > 0) console.log(`    missing: ${group.missing.join(', ')}`);
    for (const error of group.validationErrors) console.log(`    invalid: ${error.field} (${error.reason})`);
  }
  console.log(`  blocking groups: ${report.readyBlockingGroups}/${report.blockingGroups}`);
  console.log(`  all groups ready: ${report.readyGroups}/${report.totalGroups}`);
}

if (strict && !report.ready) process.exitCode = 1;

function hasValue(name) {
  return typeof process.env[name] === 'string' && process.env[name].trim().length > 0;
}

function normalizeEnvironment(value) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (['production', 'staging', 'non-production'].includes(normalized)) return normalized;
  return 'non-production';
}

function validateGroup(groupName, targetEnvironment) {
  if (groupName === 'deployed-environment') return validateDeployedUrls(targetEnvironment);
  if (groupName === 'vendor-uat') return validateVendorUrls(targetEnvironment);
  return [];
}

function validateDeployedUrls(targetEnvironment) {
  const fields = ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL'];
  const errors = fields.flatMap((field) => validateHttpUrl(field, { requireHttps: targetEnvironment === 'production' }));
  const parsed = fields
    .filter(hasValue)
    .map((field) => ({ field, url: safeParseHttpUrl(process.env[field]) }))
    .filter((entry) => entry.url);

  const origins = new Map();
  for (const { field, url } of parsed) {
    const owner = origins.get(url.origin);
    if (owner) {
      errors.push({ field, reason: `same origin as ${owner}` });
    } else {
      origins.set(url.origin, field);
    }
  }
  return errors;
}

function validateVendorUrls(targetEnvironment) {
  const errors = validateHttpUrl('P6_PROVIDER_BASE_URL', { requireHttps: targetEnvironment === 'production' });
  if (hasValue('P6_PROVIDER_CALLBACK_URL')) {
    errors.push(...validateHttpUrl('P6_PROVIDER_CALLBACK_URL', { requireHttps: targetEnvironment === 'production' }));
  }
  return errors;
}

function validateHttpUrl(field, { requireHttps }) {
  if (!hasValue(field)) return [];
  const url = safeParseHttpUrl(process.env[field]);
  if (!url) return [{ field, reason: 'must be a valid http or https URL' }];
  if (url.username || url.password) return [{ field, reason: 'must not contain embedded credentials' }];
  if (requireHttps && url.protocol !== 'https:') return [{ field, reason: 'must use HTTPS for production' }];
  return [];
}

function safeParseHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
