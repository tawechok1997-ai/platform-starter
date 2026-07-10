import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

export type WithdrawalWorkflowMeta = { ipAddress?: string; userAgent?: string };
export type PaymentProofInput = {
  slipImageData?: string;
  slipImageName?: string;
  transactionRef?: string;
  note?: string;
};

@Injectable()
export class WithdrawalWorkflowService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async approveForPayment(requestId: string, adminUserId: string, note?: string, meta: WithdrawalWorkflowMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string; status: string; claimed_by: string | null }>>(Prisma.sql`
        SELECT "id", "status"::text AS status, "claimed_by"
        FROM "withdrawal_requests"
        WHERE "id" = ${requestId}::uuid
        FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (request.claimed_by && request.claimed_by !== adminUserId) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      if (!['PENDING', 'PENDING_REVIEW'].includes(request.status)) throw new ConflictException(`Withdrawal is not waiting for review: ${request.status}`);

      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "withdrawal_requests"
        SET "status" = 'APPROVED_FOR_PAYMENT'::"WithdrawalRequestStatus",
            "approved_for_payment_by" = ${adminUserId}::uuid,
            "approved_for_payment_at" = NOW(),
            "admin_note" = ${note ?? null},
            "reviewed_by" = ${adminUserId}::uuid,
            "reviewed_at" = NOW(),
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
          AND "status"::text IN ('PENDING', 'PENDING_REVIEW')
      `);
      if (changed !== 1) throw new ConflictException('Withdrawal state changed during approval');
      await tx.adminAuditLog.create({ data: { adminUserId, action: 'APPROVE_WITHDRAWAL_FOR_PAYMENT', module: 'withdrawals', targetId: requestId, oldData: { status: request.status }, newData: { status: 'APPROVED_FOR_PAYMENT', note }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return { ok: true, status: 'APPROVED_FOR_PAYMENT' };
    });
  }

  async uploadPaymentProof(requestId: string, adminUserId: string, input: PaymentProofInput, meta: WithdrawalWorkflowMeta = {}) {
    const dataUrl = input.slipImageData?.trim();
    if (!dataUrl) throw new BadRequestException('Payment slip image is required');
    const match = dataUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/);
    if (!match) throw new BadRequestException('Payment slip must be jpg, png, or webp');
    const buffer = Buffer.from(match[3], 'base64');
    if (!buffer.length) throw new BadRequestException('Payment slip is empty');
    if (buffer.length > 1_500_000) throw new BadRequestException('Payment slip is too large');

    const fileHash = createHash('sha256').update(buffer).digest('hex');
    const transactionRef = input.transactionRef?.trim() || null;
    const duplicate = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id" FROM "withdrawal_requests"
      WHERE "id" <> ${requestId}::uuid
        AND (
          "payment_slip_file_hash" = ${fileHash}
          OR (${transactionRef}::text IS NOT NULL AND "payment_transaction_ref" = ${transactionRef})
        )
      LIMIT 1
    `);
    if (duplicate[0]) throw new ConflictException(`หลักฐานการโอนนี้เคยใช้กับรายการ ${duplicate[0].id}`);

    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const key = `withdrawal-proofs/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    await this.storage.put(key, buffer, match[1]);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<Array<{ status: string }>>(Prisma.sql`
          SELECT "status"::text AS status FROM "withdrawal_requests"
          WHERE "id" = ${requestId}::uuid FOR UPDATE
        `);
        if (!rows[0]) throw new NotFoundException('Withdrawal request not found');
        if (rows[0].status !== 'APPROVED_FOR_PAYMENT') throw new ConflictException(`Withdrawal cannot accept proof: ${rows[0].status}`);

        const changed = await tx.$executeRaw(Prisma.sql`
          UPDATE "withdrawal_requests"
          SET "status" = 'PAYMENT_PROOF_UPLOADED'::"WithdrawalRequestStatus",
              "payment_slip_url" = ${key},
              "payment_slip_file_hash" = ${fileHash},
              "payment_transaction_ref" = ${transactionRef},
              "payment_uploaded_by" = ${adminUserId}::uuid,
              "payment_uploaded_at" = NOW(),
              "admin_note" = ${input.note ?? null},
              "updated_at" = NOW()
          WHERE "id" = ${requestId}::uuid
            AND "status" = 'APPROVED_FOR_PAYMENT'::"WithdrawalRequestStatus"
        `);
        if (changed !== 1) throw new ConflictException('Withdrawal state changed during proof upload');
        await tx.adminAuditLog.create({ data: { adminUserId, action: 'UPLOAD_WITHDRAWAL_PAYMENT_PROOF', module: 'withdrawals', targetId: requestId, oldData: { status: 'APPROVED_FOR_PAYMENT' }, newData: { status: 'PAYMENT_PROOF_UPLOADED', paymentSlipUrl: key, transactionRef, fileHash }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
        return { ok: true, status: 'PAYMENT_PROOF_UPLOADED', paymentSlipUrl: key, fileHash };
      });
    } catch (error: any) {
      if (String(error?.code ?? '').includes('P2002') || String(error?.message ?? '').includes('unique')) throw new ConflictException('หลักฐานหรือเลขอ้างอิงการโอนนี้ถูกใช้แล้ว');
      throw error;
    }
  }

  async verifyAndComplete(requestId: string, adminUserId: string, note?: string, meta: WithdrawalWorkflowMeta = {}) {
    const idempotencyKey = `withdrawal:${requestId}:payment-verified`;
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; payment_slip_url: string | null; user_id: string; amount: Prisma.Decimal; currency: string }>>(Prisma.sql`
        SELECT "status"::text AS status, "payment_slip_url", "user_id", "amount", "currency"
        FROM "withdrawal_requests"
        WHERE "id" = ${requestId}::uuid
        FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (request.status === 'COMPLETED' || request.status === 'PAYMENT_VERIFIED') {
        const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
        if (existing) return { ok: true, status: 'COMPLETED', ledgerId: existing.id, idempotent: true };
      }
      if (request.status !== 'PAYMENT_PROOF_UPLOADED') throw new ConflictException(`Withdrawal is not ready for verification: ${request.status}`);
      if (!request.payment_slip_url) throw new BadRequestException('Payment proof is required');

      const wallet = await tx.wallet.findUnique({ where: { userId: request.user_id } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      if (wallet.lockedBalance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');
      if (wallet.balance.lt(request.amount)) throw new BadRequestException('Balance is not enough');

      const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
      if (existing) return { ok: true, status: 'COMPLETED', ledgerId: existing.id, idempotent: true };

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.minus(request.amount);
      const lockedAfter = wallet.lockedBalance.minus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter, lockedBalance: lockedAfter } });
      const ledger = await tx.walletLedger.create({ data: { walletId: wallet.id, userId: request.user_id, type: 'WITHDRAWAL', direction: 'DEBIT', amount: request.amount, balanceBefore, balanceAfter, referenceType: 'withdrawal_request', referenceId: requestId, idempotencyKey, metadata: { workflow: 'approve_upload_verify', paymentSlipUrl: request.payment_slip_url, note }, createdByAdminId: adminUserId } });

      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "withdrawal_requests"
        SET "status" = 'COMPLETED'::"WithdrawalRequestStatus",
            "payment_verified_by" = ${adminUserId}::uuid,
            "payment_verified_at" = NOW(),
            "completed_ledger_id" = ${ledger.id}::uuid,
            "reviewed_by" = ${adminUserId}::uuid,
            "reviewed_at" = NOW(),
            "admin_note" = ${note ?? null},
            "claimed_by" = NULL,
            "claimed_at" = NULL,
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
          AND "status" = 'PAYMENT_PROOF_UPLOADED'::"WithdrawalRequestStatus"
      `);
      if (changed !== 1) throw new ConflictException('Withdrawal state changed during verification');
      await tx.adminAuditLog.create({ data: { adminUserId, action: 'VERIFY_AND_COMPLETE_WITHDRAWAL', module: 'withdrawals', targetId: requestId, oldData: { status: 'PAYMENT_PROOF_UPLOADED', balanceBefore: balanceBefore.toString(), lockedBalance: wallet.lockedBalance.toString() }, newData: { status: 'COMPLETED', balanceAfter: balanceAfter.toString(), lockedAfter: lockedAfter.toString(), ledgerId: ledger.id }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return { ok: true, status: 'COMPLETED', ledgerId: ledger.id, balanceAfter: balanceAfter.toString(), lockedAfter: lockedAfter.toString() };
    });
  }
}
