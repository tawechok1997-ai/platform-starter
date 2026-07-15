import fs from 'node:fs';

const servicePath = 'apps/api/src/database/prisma.service.ts';
const monitorPath = 'apps/api/src/database/query-performance.monitor.ts';
const specPath = 'apps/api/src/database/query-performance.monitor.spec.ts';

const service = fs.readFileSync(servicePath, 'utf8');
const monitor = fs.readFileSync(monitorPath, 'utf8');
const spec = fs.readFileSync(specPath, 'utf8');
const failures = [];

for (const symbol of ['QueryPerformanceMonitor', "this.$on('query'", 'PRISMA_SLOW_QUERY_MS', 'PRISMA_N1_BURST_THRESHOLD']) {
  if (!service.includes(symbol)) failures.push(`missing Prisma performance integration: ${symbol}`);
}
for (const signal of ["kind: 'slow-query'", "kind: 'n-plus-one-burst'", 'fingerprintQuery']) {
  if (!monitor.includes(signal)) failures.push(`missing performance signal contract: ${signal}`);
}
if (!service.includes("event: 'prisma-query-performance'")) failures.push('structured log event name missing');
if (/logger\.(warn|log|error)\([^\n]*(event\.query|event\.params)/.test(service)) {
  failures.push('raw SQL or query params must not be logged');
}
if (!spec.includes("not.toContain('SELECT')")) failures.push('raw-SQL redaction contract test missing');
if (!spec.includes('n-plus-one-burst')) failures.push('N+1 burst contract test missing');

if (failures.length) {
  console.error('R-010 query performance metrics audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-010 query performance metrics audit passed.');
