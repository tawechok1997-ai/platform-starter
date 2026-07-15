import fs from 'node:fs';

const domainPath = 'apps/api/src/common/errors/domain-error.ts';
const mapperPath = 'apps/api/src/common/errors/domain-error-http.mapper.ts';
const filterPath = 'apps/api/src/common/filters/http-exception.filter.ts';

const domain = fs.readFileSync(domainPath, 'utf8');
const mapper = fs.readFileSync(mapperPath, 'utf8');
const filter = fs.readFileSync(filterPath, 'utf8');

const failures = [];

if (/from ['"]@nestjs\//.test(domain)) {
  failures.push('DomainError must not import NestJS or HTTP infrastructure.');
}
if (!domain.includes("export class DomainError extends Error")) {
  failures.push('DomainError taxonomy class is missing.');
}
if (!domain.includes("export type DomainErrorCategory")) {
  failures.push('DomainError category taxonomy is missing.');
}
if (!mapper.includes('mapDomainErrorToHttp')) {
  failures.push('Central domain-to-HTTP mapper is missing.');
}
if (!filter.includes('isDomainError(exception)')) {
  failures.push('Global exception filter does not detect DomainError.');
}
if (!filter.includes('mapDomainErrorToHttp(exception)')) {
  failures.push('Global exception filter does not use the central mapper.');
}
if (!filter.includes('resolveApiErrorCode(message)')) {
  failures.push('Legacy message resolver fallback was removed before migration completed.');
}

if (failures.length > 0) {
  console.error('R-011 error-boundary audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-011 error-boundary audit passed.');
