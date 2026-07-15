import fs from 'node:fs';

const files = {
  reason: 'apps/api/src/common/security/reason-audit-policy.ts',
  normalization: 'apps/api/src/common/security/input-normalization.ts',
  reasonTest: 'apps/api/src/common/security/reason-audit-policy.spec.ts',
  normalizationTest: 'apps/api/src/common/security/input-normalization.spec.ts',
};

for (const path of Object.values(files)) {
  if (!fs.existsSync(path)) throw new Error(`Missing R-011 security policy file: ${path}`);
}

const reason = fs.readFileSync(files.reason, 'utf8');
const normalization = fs.readFileSync(files.normalization, 'utf8');
const combined = `${reason}\n${normalization}`;

if (/from ['"]@nestjs\//.test(combined) || /from ['"][^'"]*prisma/.test(combined)) {
  throw new Error('R-011 security policy foundations must not depend on NestJS or Prisma');
}

for (const token of [
  'AUTH_REASON_REQUIRED',
  'AUTH_REASON_TOO_SHORT',
  'AUTH_REASON_TOO_LONG',
  'AUTH_AUDIT_EVENT_REQUIRED',
]) {
  if (!reason.includes(token)) throw new Error(`Missing stable policy error code: ${token}`);
}

for (const fn of ['normalizeUnicodeText', 'normalizeEmail', 'normalizePhone', 'normalizeBankAccount']) {
  if (!normalization.includes(`function ${fn}`)) throw new Error(`Missing shared normalization function: ${fn}`);
}

console.log('R-011 security policy foundation guard passed');
