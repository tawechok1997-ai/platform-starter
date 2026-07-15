import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(ROOT, file));

const schema = read('prisma/schema.prisma');
const master = read('docs/master-project-worklist.md');
const validation = read('apps/api/src/common/validation/validation-boundary.ts');

const checks = [
  ['validation layers are explicit', /'dto'\s*\|\s*'business'\s*\|\s*'persistence'/.test(validation)],
  ['persistence validation maps to conflict', /persistence[^\n]*\?\s*'conflict'/.test(validation)],
  ['business assertion uses DomainError boundary', /assertBusinessRule[\s\S]*validationFailure/.test(validation)],
  ['CSRF origin protection is recorded', /CSRF origin check/.test(master)],
  ['TopUpRequest idempotency is unique', /model\s+TopUpRequest[\s\S]*?idempotencyKey\s+String\?[^\n]*@unique/.test(schema)],
  ['WithdrawalRequest idempotency is unique', /model\s+WithdrawalRequest[\s\S]*?idempotencyKey\s+String\?[^\n]*@unique/.test(schema)],
  ['WalletLedger idempotency is unique', /model\s+WalletLedger[\s\S]*?idempotencyKey\s+String\?[^\n]*@unique/.test(schema)],
  ['GameTransfer idempotency is unique', /model\s+GameTransfer[\s\S]*?idempotencyKey\s+String[^\n]*@unique/.test(schema)],
  ['WebhookLog has idempotency index', /model\s+WebhookLog[\s\S]*?@@index\(\[idempotencyKey\]\)/.test(schema)],
  ['R009 idempotency closure audit remains present', exists('tools/audit-r009-critical-constraint-closure.mjs')],
];

const failed = checks.filter(([, passed]) => !passed).map(([name]) => name);
if (failed.length) {
  console.error('R-011 request-safety boundary audit failed:');
  for (const name of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`R-011 request-safety boundary audit passed (${checks.length} checks).`);
