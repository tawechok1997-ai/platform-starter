import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const schemaPath = path.join(ROOT, 'prisma', 'schema.prisma');
const portsPath = path.join(ROOT, 'apps', 'api', 'src', 'common', 'application', 'critical-repository-ports.ts');
const JSON_MODE = process.env.R009_ADAPTER_SCHEMA_JSON === '1';
const STRICT_MODE = process.env.R009_ADAPTER_SCHEMA_STRICT === '1';

const schema = fs.readFileSync(schemaPath, 'utf8');
const ports = fs.readFileSync(portsPath, 'utf8');

const checks = [
  {
    domain: 'deposit',
    port: 'DepositRepositoryPort',
    models: ['TopUpRequest'],
    compatible: /model\s+TopUpRequest\s*\{/.test(schema),
  },
  {
    domain: 'withdrawal',
    port: 'WithdrawalRepositoryPort',
    models: ['WithdrawalRequest'],
    compatible: /model\s+WithdrawalRequest\s*\{/.test(schema),
  },
  {
    domain: 'ownership',
    port: 'AdminOwnershipRepositoryPort',
    models: ['AdminUser', 'AdminUserRole', 'Role'],
    compatible: ['AdminUser', 'AdminUserRole', 'Role'].every((model) => new RegExp(`model\\s+${model}\\s*\\{`).test(schema)),
  },
  {
    domain: 'kyc-watchlist',
    port: 'KycWatchlistRepositoryPort',
    models: ['KycRequest', 'WatchlistMatch'],
    compatible: /model\s+KycRequest\s*\{/.test(schema) && /model\s+WatchlistMatch\s*\{/.test(schema),
  },
  {
    domain: 'promotion-settlement',
    port: 'PromotionSettlementRepositoryPort',
    models: ['PromotionSettlement'],
    compatible: /model\s+PromotionSettlement\s*\{/.test(schema),
  },
].map((check) => ({
  ...check,
  portPresent: new RegExp(`interface\\s+${check.port}\\b`).test(ports),
}));

const missingPorts = checks.filter((check) => !check.portPresent);
const incompatibleDomains = checks.filter((check) => check.portPresent && !check.compatible);
const result = {
  audit: 'R-009 adapter schema compatibility',
  checks,
  missingPorts,
  incompatibleDomains,
};

if (JSON_MODE) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  console.log(`R-009 adapter schema compatibility: ${checks.length} critical domain(s).`);
  for (const check of checks) {
    const state = !check.portPresent ? 'missing-port' : check.compatible ? 'compatible' : 'requires-model-mapping';
    console.log(`- ${check.domain}: ${state} (${check.models.join(', ')})`);
  }
}

if (STRICT_MODE && missingPorts.length > 0) {
  console.error('R-009 adapter schema compatibility failed: critical repository port is missing.');
  process.exitCode = 1;
}
