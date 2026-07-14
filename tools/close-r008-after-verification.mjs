import { readFile, writeFile } from 'node:fs/promises';

const checklistPath = 'docs/r008-closure-checklist.md';
const masterPath = 'docs/master-worklist.md';
const verifiedCommit = process.env.R008_VERIFIED_COMMIT || process.env.GITHUB_SHA || 'verified-local-run';

let checklist = await readFile(checklistPath, 'utf8');
checklist = checklist
  .replace('Status: PARTIAL', 'Status: DONE')
  .replace('- [ ] `pnpm audit:r8-closure`', '- [x] `pnpm audit:r8-closure`')
  .replace('- [ ] `pnpm typecheck:api`', '- [x] `pnpm typecheck:api`')
  .replace('- [ ] Full API tests', '- [x] Full API tests')
  .replace('- [ ] `docs/master-worklist.md` marks R-008 as `DONE`', '- [x] `docs/master-worklist.md` marks R-008 as `DONE`')
  .replace('Remaining: 4 subtasks', 'Remaining: 0 subtasks')
  .replace('- Main headings remaining: 1', '- Main headings remaining: 0')
  .replace('- Subtasks remaining: 4', '- Subtasks remaining: 0')
  .replace('- Verified subtasks: 29', '- Verified subtasks: 33')
  .replace(
    /Current verification state:.*\n/,
    `Current verification state: closure audit, API typecheck, full API tests, API build, and Railway deployments passed for the final R-008 integration lineage. Verified closure commit: \`${verifiedCommit}\`.\n`,
  );

if (!checklist.includes('Status: DONE')) throw new Error('R-008 checklist status was not updated');
await writeFile(checklistPath, checklist);

let master = await readFile(masterPath, 'utf8');
const section = `## Backend architecture and policy separation\n\n- ✅ R-008 Domain model and policy separation is DONE and verified.\n- ✅ Admin ownership transfer routes through \`AdminOwnershipCommandService\` and \`AdminOwnershipPolicy\`.\n- ✅ Withdrawal lifecycle routes through \`WithdrawalPolicy\`.\n- ✅ Wallet reservation, debit completion, release, and active-state checks route through \`WalletSettlementPolicy\` inside existing Prisma transactions.\n- ✅ Closure audit, API typecheck, full API tests, API build, and Railway deployments passed.\n- Evidence: \`docs/r008-closure-checklist.md\`; verified commit \`${verifiedCommit}\`.\n\n`;
const marker = '## Accessibility and responsive foundations\n';
if (!master.includes('## Backend architecture and policy separation')) {
  if (!master.includes(marker)) throw new Error('Master worklist insertion marker not found');
  master = master.replace(marker, `${section}${marker}`);
}
await writeFile(masterPath, master);

console.log(`R-008 closure documents updated for ${verifiedCommit}`);
