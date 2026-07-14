import fs from 'node:fs';

const path = 'apps/api/src/modules/admin-members/admin-members-query.service.ts';
const source = fs.readFileSync(path, 'utf8');
const failures = [];

const listStart = source.indexOf('async listMembers(');
const detailStart = source.indexOf('async getMemberDetail(');
if (listStart < 0 || detailStart < 0 || detailStart <= listStart) {
  failures.push('Could not isolate listMembers from getMemberDetail');
} else {
  const listBlock = source.slice(listStart, detailStart);
  if (/include\s*:\s*\{/.test(listBlock)) failures.push('listMembers must not use relation include');
  if (!/select\s*:\s*MEMBER_LIST_PROJECTION/.test(listBlock)) failures.push('listMembers must use MEMBER_LIST_PROJECTION');
}

for (const required of [
  'const MEMBER_LIST_PROJECTION',
  'profile: { select: { displayName: true } }',
  'balance: true',
  'lockedBalance: true',
  'type MemberListRecord = Prisma.UserGetPayload<{ select: typeof MEMBER_LIST_PROJECTION }>',
]) {
  if (!source.includes(required)) failures.push(`Missing projection contract: ${required}`);
}

for (const forbidden of [
  'profile: true, wallet: true }, orderBy',
  'Prisma.UserGetPayload<{ include: { profile: true; wallet: true } }>',
]) {
  if (source.includes(forbidden)) failures.push(`Broad list relation payload returned: ${forbidden}`);
}

if (failures.length) {
  console.error('R-010 admin member list projection guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('R-010 admin member list projection guard passed.');
}
