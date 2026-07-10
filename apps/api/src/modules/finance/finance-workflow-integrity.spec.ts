import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

describe('staged finance workflow integrity', () => {
  const schema = source('../../prisma/schema.prisma');
  const topupController = source('src/modules/topups/topups.controller.ts');
  const depositController = source('src/modules/topups/deposit-workflow.controller.ts');
  const depositService = source('src/modules/topups/deposit-workflow.service.ts');
  const withdrawalController = source('src/modules/withdrawals/withdrawals.controller.ts');
  const withdrawalWorkflow = source('src/modules/withdrawals/withdrawal-workflow.service.ts');

  it('keeps the Prisma schema aligned with staged request statuses and evidence fields', () => {
    for (const token of ['PENDING_SLIP_REVIEW', 'PENDING_CREDIT', 'PAYMENT_PROOF_UPLOADED', 'slipUrl', 'paymentSlipUrl', 'creditedLedgerId', 'completedLedgerId']) {
      expect(schema).toContain(token);
    }
  });

  it('removes direct-credit and direct-complete endpoints', () => {
    expect(topupController).not.toContain("admin/topups/:id/confirm");
    expect(topupController).not.toContain("admin/topups/:id/decline");
    expect(withdrawalController).not.toContain("admin/withdrawals/:id/complete");
    expect(depositController).toContain("admin/topups/:id/approve-slip");
    expect(depositController).toContain("admin/topups/:id/confirm-credit");
  });

  it('requires a claim for sensitive staged actions and cleans up failed evidence writes', () => {
    expect(depositService).toContain('ต้อง claim รายการก่อนตรวจสลิป');
    expect(depositService).toContain('ต้อง claim รายการก่อนยืนยันเครดิต');
    expect(depositService).toContain('this.storage.remove(key).catch');
    expect(withdrawalWorkflow).toContain('ต้อง claim รายการก่อนอัปโหลดหลักฐาน');
    expect(withdrawalWorkflow).toContain('ต้อง claim รายการก่อนยืนยันการจ่าย');
    expect(withdrawalWorkflow).toContain('this.storage.remove(key).catch');
  });
});
