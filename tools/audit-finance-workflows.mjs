import { readFile } from 'node:fs/promises';

const checks = [
  {
    file: 'apps/api/src/modules/topups/deposit-workflow.service.ts',
    required: [
      ['row lock', 'FOR UPDATE'],
      ['claim owner guard', 'assertClaimOwner'],
      ['credit idempotency', 'topup:${requestId}:credit-confirmed'],
      ['storage cleanup', 'this.storage.remove(key)'],
    ],
  },
  {
    file: 'apps/api/src/modules/withdrawals/withdrawal-workflow.service.ts',
    required: [
      ['row lock', 'FOR UPDATE'],
      ['claim owner guard', 'assertClaimOwner'],
      ['completion idempotency', 'withdrawal:${requestId}:payment-verified'],
      ['storage cleanup', 'this.storage.remove(key)'],
    ],
  },
];

let failed = false;
for (const check of checks) {
  const source = await readFile(check.file, 'utf8');
  for (const [label, marker] of check.required) {
    if (!source.includes(marker)) {
      failed = true;
      console.error(`[FAIL] ${check.file}: missing ${label} (${marker})`);
    } else {
      console.log(`[PASS] ${check.file}: ${label}`);
    }
  }
}

if (failed) process.exitCode = 1;
