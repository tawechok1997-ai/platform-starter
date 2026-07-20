import { readFile } from 'node:fs/promises';

const contractPath = 'apps/api/src/modules/admin-members/member-query.contract.ts';
const modulePath = 'apps/api/src/modules/admin-members/admin-members.module.ts';

const [contract, moduleSource] = await Promise.all([
  readFile(contractPath, 'utf8'),
  readFile(modulePath, 'utf8'),
]);

const failures = [];
const forbiddenMutationTerms = [
  'updateMemberStatus',
  'suspend',
  'lockMember',
  'closeMember',
  'AdminMembersCommandService',
];

for (const term of forbiddenMutationTerms) {
  if (contract.includes(term)) failures.push(`${contractPath} must not expose mutation term: ${term}`);
}

if (!contract.includes("export const MEMBER_QUERY = Symbol('MEMBER_QUERY')")) {
  failures.push(`${contractPath} must export the MEMBER_QUERY injection token`);
}

if (!moduleSource.includes('{ provide: MEMBER_QUERY, useExisting: AdminMembersQueryService }')) {
  failures.push(`${modulePath} must bind MEMBER_QUERY to AdminMembersQueryService`);
}

if (!moduleSource.includes('exports: [') || !moduleSource.includes('MEMBER_QUERY,')) {
  failures.push(`${modulePath} must export MEMBER_QUERY for cross-module read consumers`);
}

if (failures.length > 0) {
  console.error('Member query boundary audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Member query boundary audit passed.');
}
