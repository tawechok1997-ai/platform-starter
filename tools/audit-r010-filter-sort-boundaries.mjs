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

if (!utility.includes("import { BadRequestException } from '@nestjs/common'")) {
  failures.push('query helper must reject invalid input with BadRequestException');
}
for (const message of [
  'exceeds the maximum allowed length',
  'Invalid ${options.fieldName ?? \'filter\'} value',
  'Invalid sortBy value',
  'Invalid sortDirection value',
]) {
  if (!utility.includes(message)) failures.push(`strict query rejection missing: ${message}`);
}
if (/\.slice\(0,\s*Math\.max\(maxLength/.test(utility)) {
  failures.push('oversized query text must be rejected instead of truncated');
}
if (/allowedFields\.includes\([^)]*\)\s*\?\s*\(field as TField\)\s*:\s*defaults\.field/.test(utility)) {
  failures.push('invalid sort fields must not silently fall back to defaults');
}

if (!service.includes("const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_MEMBER', 'CLOSED'] as const")) {
  failures.push('support status whitelist drifted');
}
if (!service.includes("const SUPPORT_CATEGORIES = ['general', 'finance', 'account', 'game', 'technical'] as const")) {
  failures.push('support category whitelist drifted');
}
if (!service.includes("const SUPPORT_SORT_FIELDS = ['createdAt', 'updatedAt', 'status'] as const")) {
  failures.push('support sort whitelist drifted');
}
if (!service.includes("fieldName: 'status'") || !service.includes("fieldName: 'category'")) {
  failures.push('support enum filters must report the rejected field');
}
if (!service.includes("fieldName: 'search'")) failures.push('support search length must be strictly validated');
if (!service.includes("field: 'createdAt'") || !service.includes("direction: 'desc'")) {
  failures.push('support default sort must remain createdAt desc');
}
if (!service.includes('{ id: sort.direction }')) failures.push('support cursor sort requires id tie-breaker');
if (!dto.includes("@IsIn(['createdAt', 'updatedAt', 'status'])")) failures.push('support sortBy DTO whitelist missing');
if (!dto.includes("@IsIn(['asc', 'desc'])")) failures.push('support sortDirection DTO whitelist missing');
if (!dto.includes("@IsIn(['ALL', 'general', 'finance', 'account', 'game', 'technical'])")) {
  failures.push('support category DTO whitelist missing');
}
if (/query\.search\?\.trim\(\)/.test(service)) failures.push('support service must not parse search locally');
if (/query\.status\s+as\s+RiskAlertStatus/.test(service)) failures.push('support service must not directly cast raw status input');

if (failures.length) {
  console.error('R-010 filter/sort boundary audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('R-010 strict filter/sort boundary audit passed.');
