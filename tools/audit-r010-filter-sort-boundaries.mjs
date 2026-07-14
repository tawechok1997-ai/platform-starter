import fs from 'node:fs';

const utilityPath = 'apps/api/src/common/query/query-filters.ts';
const dtoPath = 'apps/api/src/modules/support/dto/support-query.dto.ts';
const servicePath = 'apps/api/src/modules/support/support-query.service.ts';

const utility = fs.readFileSync(utilityPath, 'utf8');
const dto = fs.readFileSync(dtoPath, 'utf8');
const service = fs.readFileSync(servicePath, 'utf8');
const failures = [];

for (const symbol of ['normalizeOptionalText', 'parseOptionalEnum', 'parseSort']) {
  if (!utility.includes(`function ${symbol}`)) failures.push(`missing shared helper ${symbol}`);
  if (!service.includes(symbol)) failures.push(`support query service does not use ${symbol}`);
}

if (!service.includes("const SUPPORT_SORT_FIELDS = ['createdAt', 'updatedAt', 'status'] as const")) {
  failures.push('support sort whitelist drifted');
}
if (!service.includes("field: 'createdAt'") || !service.includes("direction: 'desc'")) {
  failures.push('support default sort must remain createdAt desc');
}
if (!service.includes('{ id: sort.direction }')) failures.push('support cursor sort requires id tie-breaker');
if (!dto.includes("@IsIn(['createdAt', 'updatedAt', 'status'])")) failures.push('support sortBy DTO whitelist missing');
if (!dto.includes("@IsIn(['asc', 'desc'])")) failures.push('support sortDirection DTO whitelist missing');
if (/query\.search\?\.trim\(\)/.test(service)) failures.push('support service must not parse search locally');
if (/query\.status\s+as\s+RiskAlertStatus/.test(service)) failures.push('support service must not directly cast raw status input');

if (failures.length) {
  console.error('R-010 filter/sort boundary audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-010 filter/sort boundary audit passed.');
