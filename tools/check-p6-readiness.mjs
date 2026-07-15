const groups = [
  {
    name: 'deployed-environment',
    required: ['P6_API_URL', 'P6_ADMIN_URL', 'P6_MEMBER_URL'],
  },
  {
    name: 'seeded-credentials',
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
    required: ['P6_PROVIDER_CODE', 'P6_PROVIDER_BASE_URL'],
    optional: ['P6_PROVIDER_API_KEY', 'P6_PROVIDER_SECRET', 'P6_PROVIDER_CALLBACK_URL'],
  },
];

const strict = process.argv.includes('--strict');
const json = process.argv.includes('--json');

const report = {
  generatedAt: new Date().toISOString(),
  strict,
  groups: groups.map((group) => {
    const missing = group.required.filter((name) => !hasValue(name));
    const present = group.required.filter(hasValue);
    const optionalPresent = (group.optional ?? []).filter(hasValue);
    return {
      name: group.name,
      ready: missing.length === 0,
      required: group.required,
      present,
      missing,
      optionalPresent,
    };
  }),
};

report.readyGroups = report.groups.filter((group) => group.ready).length;
report.totalGroups = report.groups.length;
report.ready = report.readyGroups === report.totalGroups;

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('P6 external readiness');
  for (const group of report.groups) {
    console.log(`  ${group.ready ? 'READY' : 'BLOCKED'} ${group.name}`);
    if (group.missing.length > 0) console.log(`    missing: ${group.missing.join(', ')}`);
  }
  console.log(`  ready groups: ${report.readyGroups}/${report.totalGroups}`);
}

if (strict && !report.ready) process.exitCode = 1;

function hasValue(name) {
  return typeof process.env[name] === 'string' && process.env[name].trim().length > 0;
}
