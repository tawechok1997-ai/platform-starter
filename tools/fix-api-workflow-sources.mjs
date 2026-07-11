import { readFile, writeFile } from 'node:fs/promises';

const fixes = [
  {
    path: 'apps/api/src/modules/topups/deposit-workflow.service.ts',
    transform(source) {
      const duplicateDeclarations = `    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];\n    const key = \`slips/\${new Date().toISOString().slice(0, 10)}/\${randomUUID()}.\${ext}\`;\n    const detectedAmount = input.detectedAmount && Number.isFinite(Number(input.detectedAmount)) ? Number(input.detectedAmount) : null;\n    const transferredAt = input.transferredAt ? new Date(input.transferredAt) : null;\n    if (transferredAt && Number.isNaN(transferredAt.getTime())) throw new BadRequestException('Invalid transferredAt');`;

      const normalizedDeclarations = `    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];\n    const key = \`slips/\${new Date().toISOString().slice(0, 10)}/\${randomUUID()}.\${ext}\`;`;

      return source
        .replace(duplicateDeclarations, normalizedDeclarations)
        .replace('      this.assertClaimOwner(request.claimed_by, adminUserId);\n', '');
    },
  },
  {
    path: 'apps/api/src/modules/withdrawals/withdrawal-workflow.service.ts',
    transform(source) {
      return source
        .replace(
          "        if (request.status !== 'APPROVED_FOR_PAYMENT') throw new ConflictException(`Withdrawal cannot accept proof: ${request.status}`);",
          "        if (rows[0].status !== 'APPROVED_FOR_PAYMENT') throw new ConflictException(`Withdrawal cannot accept proof: ${rows[0].status}`);",
        )
        .replace('      this.assertClaimOwner(request.claimed_by, adminUserId);\n', '');
    },
  },
];

let changedFiles = 0;

for (const fix of fixes) {
  const source = await readFile(fix.path, 'utf8');
  const updated = fix.transform(source);

  if (updated !== source) {
    await writeFile(fix.path, updated, 'utf8');
    changedFiles += 1;
    console.log(`Fixed ${fix.path}`);
  } else {
    console.log(`No changes needed for ${fix.path}`);
  }
}

console.log(`API workflow source normalization complete (${changedFiles} file(s) changed).`);
