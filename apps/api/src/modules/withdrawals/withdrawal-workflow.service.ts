import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

type WithdrawalWorkflowMeta = { ipAddress?: string; userAgent?: string };
type PaymentProofInput = {
  slipImageData?: string;
  slipImageName?: string;
  transactionRef?: string;
  note?: string;
};

type LockedWalletRow = {
  id: string;
  user_id: string;
  status: string;
  balance: Prisma.Decimal;
  locked_balance: Prisma.Decimal;
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
      if (!request.claimed_by) throw new ConflictException('ต้อง claim รายการก่อนอนุมัติ');
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
          AND "claimed_by" = ${adminUserId}::uuid
          AND "status"::text IN ('PENDING', 'PENDING_REVIEW')
      `);
      if (changed !== 1) throw new ConflictException('Withdrawal state or claim changed during approval');
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId,
          action: 'APPROVE_WITHDRAWAL_FOR_PAYMENT',
          module: 'withdrawals',
          targetId: requestId,
          oldData: { status: request.status },
          newData: { status: 'APPROVED_FOR_PAYMENT', note },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
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
      const result = await this.prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<Array<{ status: string; claimed_by: string | null }>>(Prisma.sql`
          SELECT "status"::text AS status, "claimed_by" FROM "withdrawal_requests"
          WHERE "id" = ${requestId}::uuid FOR UPDATE
        `);
        if (!rows[0]) throw new NotFoundException('Withdrawal request not found');
        if (!rows[0].claimed_by) throw new ConflictException('ต้อง claim รายการก่อนอัปโหลดหลักฐาน');
        if (rows[0].claimed_by !== adminUserId) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
        if (rows[0].status === 'PAYMENT_PROOF_UPLOADED') {
          const existing = await tx.$queryRaw<Array<{ payment_slip_url: string | null; payment_slip_file_hash: string | null }>>(Prisma.sql`
            SELECT "payment_slip_url", "payment_slip_file_hash"
            FROM "withdrawal_requests"
            WHERE "id" = ${requestId}::uuid
          `);
          if (existing[0]?.payment_slip_file_hash === fileHash) return { ok: true, status: 'PAYMENT_PROOF_UPLOADED', paymentSlipUrl: existing[0].payment_slip_url, fileHash, idempotent: true };
        }
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
            AND "claimed_by" = ${adminUserId}::uuid
            AND "status" = 'APPROVED_FOR_PAYMENT'::"WithdrawalRequestStatus"
        `);
        if (changed !== 1) throw new ConflictException('Withdrawal state or claim changed during proof upload');
        await tx.adminAuditLog.create({
          data: buildAdminAuditData({
            adminUserId,
            action: 'UPLOAD_WITHDRAWAL_PAYMENT_PROOF',
            module: 'withdrawals',
            targetId: requestId,
            oldData: { status: 'APPROVED_FOR_PAYMENT' },
            newData: { status: 'PAYMENT_PROOF_UPLOADED', paymentSlipUrl: key, transactionRef, fileHash },
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          }),
        });
        return { ok: true, status: 'PAYMENT_PROOF_UPLOADED', paymentSlipUrl: key, fileHash };
      });
      if (result.idempotent) await this.storage.remove(key).catch(() => undefined);
      return result;
    } catch (error: any) {
      await this.storage.remove(key).catch(() => undefined);
      if (String(error?.code ?? '').includes('P2002') || String(error?.message ?? '').includes('unique')) throw new ConflictException('หลักฐานหรือเลขอ้างอิงการโอนนี้ถูกใช้แล้ว');
      throw error;
    }
  }

  async verifyAndComplete(requestId: string, adminUserId: string, note?: string, meta: WithdrawalWorkflowMeta = {}) {
    const idempotencyKey = `withdrawal:${requestId}:payment-verified`;
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; payment_slip_url: string | null; user_id: string; amount: Prisma.Decimal; currency: string; claimed_by: string | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "payment_slip_url", "user_id", "amount", "currency", "claimed_by"
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
      this.assertClaimOwner(request.claimed_by, adminUserId);
      if (request.status !== 'PAYMENT_PROOF_UPLOADED') throw new ConflictException(`Withdrawal is not ready for verification: ${request.status}`);
      if (!request.payment_slip_url) throw new BadRequestException('Payment proof is required');
      if (!request.claimed_by) throw new ConflictException('ต้อง claim รายการก่อนยืนยันการจ่าย');
      if (request.claimed_by !== adminUserId) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');

      const walletRows = await tx.$queryRaw<LockedWalletRow[]>(Prisma.sql`
        SELECT "id", "user_id", "status"::text AS status, "balance", "locked_balance"
        FROM "wallets"
        WHERE "user_id" = ${request.user_id}::uuid
        FOR UPDATE
      `);
      const wallet = walletRows[0];
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      if (wallet.locked_balance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');
      if (wallet.balance.lt(request.amount)) throw new BadRequestException('Balance is not enough');

      const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
      if (existing) return { ok: true, status: 'COMPLETED', ledgerId: existing.id, idempotent: true };

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.minus(request.amount);
      const lockedAfter = wallet.locked_balance.minus(request.amount);
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
          AND "claimed_by" = ${adminUserId}::uuid
          AND "status" = 'PAYMENT_PROOF_UPLOADED'::"WithdrawalRequestStatus"
      `);
      if (changed !== 1) throw new ConflictException('Withdrawal state or claim changed during verification');
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId,
          action: 'VERIFY_AND_COMPLETE_WITHDRAWAL',
          module: 'withdrawals',
          targetId: requestId,
          oldData: { status: 'PAYMENT_PROOF_UPLOADED', balanceBefore: balanceBefore.toString(), lockedBalance: wallet.locked_balance.toString() },
          newData: { status: 'COMPLETED', balanceAfter: balanceAfter.toString(), lockedAfter: lockedAfter.toString(), ledgerId: ledger.id },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
      return { ok: true, status: 'COMPLETED', ledgerId: ledger.id, balanceAfter: balanceAfter.toString(), lockedAfter: lockedAfter.toString() };
    });
  }

  async getPaymentProof(requestId: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id: requestId }, select: { paymentSlipUrl: true, paymentTransactionRef: true } });
    if (!request) throw new NotFoundException('Withdrawal request not found');
    if (!request.paymentSlipUrl) throw new NotFoundException('Payment proof not found');
    const stored = await this.storage.get(request.paymentSlipUrl, this.contentTypeFromKey(request.paymentSlipUrl));
    return { dataUrl: `data:${stored.contentType};base64,${stored.data.toString('base64')}`, transactionRef: request.paymentTransactionRef };
  }

  private contentTypeFromKey(key: string) {
    if (key.endsWith('.png')) return 'image/png';
    if (key.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  private assertClaimOwner(claimedBy: string | null, adminUserId: string) {
    if (!claimedBy) throw new ConflictException('ต้อง claim รายการก่อนดำเนินการ');
    if (claimedBy !== adminUserId) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
  }
}
