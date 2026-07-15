import { readFileSync } from 'node:fs';

const files = [
  'apps/api/src/common/security/authorization-policy.ts',
  'apps/api/src/common/security/step-up-policy.ts',
];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (/from ['"]@nestjs\//.test(source) || /from ['"]@prisma\//.test(source)) {
    throw new Error(`${file} must remain framework and persistence independent`);
  }
}

const authorization = readFileSync(files[0], 'utf8');
for (const token of ['requirePermission', 'requireResourceOwner', 'enforceAuthorization', 'AUTH_PERMISSION_REQUIRED', 'AUTH_RESOURCE_FORBIDDEN']) {
  if (!authorization.includes(token)) throw new Error(`authorization policy is missing ${token}`);
}

const stepUp = readFileSync(files[1], 'utf8');
for (const token of ['isFreshStepUp', 'requireFreshStepUp', 'AUTH_STEP_UP_REQUIRED', 'maxAgeMs']) {
  if (!stepUp.includes(token)) throw new Error(`step-up policy is missing ${token}`);
}

console.log('R-011 authorization and step-up policy boundaries passed');
