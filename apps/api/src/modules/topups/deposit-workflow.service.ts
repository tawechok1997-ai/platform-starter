import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { chooseStrongestDuplicateMatch, duplicateAttemptRisk, duplicateMemberMessage, DuplicateSlipMatch } from '../finance/deposit-slip-risk.policy';

export type DepositEvidenceInput = {
  slipImageData?: string;
  slipImageName?: string;
  transactionRef?: string;
  perceptualHash?: string;
  detectedAmount?: string;
  transferredAt?: string;
};

export type DepositWorkflowMeta = { ipAddress?: string; userAgent?: string };

type DuplicateRow = {
  id: string;
  slip_transaction_ref: string | null;
  slip_file_hash: string | null;
  slip_perceptual_hash: string | null;
};

@Injectable()
export class DepositWorkflowService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async submitEvidence(requestId: string, userId: string, input: DepositEvidenceInput) {
    const request = await this.prisma.topUpRequest.findFirst({ where: { id: requestId, userId } });
    if (!request) throw new NotFoundException('Top up request not found');
    if (!['PENDING'].includes(String(request.status))) throw new ConflictException(`Top up request cannot accept slip: ${request.status}`);

    const dataUrl = input.slipImageData?.trim();
    if (!dataUrl) throw new BadRequestException('Slip image is required');
    const match = dataUrl.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/);
    if (!match) throw new BadRequestException('Slip image must be jpg, png, or webp');
    const buffer = Buffer.from(match[3], 'base64');
    if (!buffer.length) throw new BadRequestException('Slip image is empty');
    if (buffer.length > 1_500_000) throw new BadRequestException('Slip image is too large');

    const fileHash = createHash('sha256').update(buffer).digest('hex');
    const transactionRef = input.transactionRef?.trim() || null;
    const perceptualHash = input.perceptualHash?.trim() || null;
    const matches = await this.findDuplicateMatches(requestId, transactionRef, fileHash, perceptualHash);
    const strongest = chooseStrongestDuplicateMatch(matches);

    if (strongest) {
      await this.markDuplicate(requestId, userId, strongest, transactionRef, fileHash, perceptualHash);
      return {
        ok: false,
        duplicate: true,
        status: 'DUPLICATE',
        message: duplicateMemberMessage(strongest),
        duplicateOfId: strongest.originalRequestId,
        reason: strongest.reason,
      };
    }

    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const key = `slips/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    await this.storage.put(key, buffer, match[1]);
    const detectedAmount = input.detectedAmount && Number.isFinite(Number(input.detectedAmount)) ? Number(input.detectedAmount) : null;
    const transferredAt = input.transferredAt ? new Date(input.transferredAt) : null;
    if (transferredAt && Number.isNaN(transferredAt.getTime())) throw new BadRequestException('Invalid transferredAt');

    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "top_up_requests"
      SET "status" = 'PENDING_SLIP_REVIEW'::"TopUpRequestStatus",
          "slip_url" = ${key},
          "slip_file_hash" = ${fileHash},
          "slip_perceptual_hash" = ${perceptualHash},
          "slip_transaction_ref" = ${transactionRef},
          "slip_detected_amount" = ${detectedAmount},
          "slip_transferred_at" = ${transferredAt},
          "updated_at" = NOW()
      WHERE "id" = ${requestId}::uuid AND "user_id" = ${userId}::uuid
    `);

    return { ok: true, duplicate: false, status: 'PENDING_SLIP_REVIEW', slipUrl: key, fileHash };
  }

  async approveSlip(requestId: string, adminUserId: string, note: string | undefined, meta: DepositWorkflowMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "top_up_requests"
        SET "status" = 'PENDING_CREDIT'::"TopUpRequestStatus",
            "slip_reviewed_by" = ${adminUserId}::uuid,
            "slip_reviewed_at" = NOW(),
            "admin_note" = ${note ?? null},
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
          AND "status" = 'PENDING_SLIP_REVIEW'::"TopUpRequestStatus"
      `);
      if (changed !== 1) throw new ConflictException('Slip is not waiting for review or was already processed');
      await tx.adminAuditLog.create({ data: { adminUserId, action: 'APPROVE_DEPOSIT_SLIP', module: 'topups', targetId: requestId, oldData: { status: 'PENDING_SLIP_REVIEW' }, newData: { status: 'PENDING_CREDIT', note }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return { ok: true, status: 'PENDING_CREDIT' };
    });
  }

  async confirmCredit(requestId: string, adminUserId: string, note: string | undefined, meta: DepositWorkflowMeta = {}) {
    const idempotencyKey = `topup:${requestId}:credit-confirmed`;
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.topUpRequest.findUnique({ where: { id: requestId } });
      if (!request) throw new NotFoundException('Top up request not found');
      const statusRows = await tx.$queryRaw<Array<{ status: string }>>(Prisma.sql`SELECT "status"::text AS status FROM "top_up_requests" WHERE "id" = ${requestId}::uuid FOR UPDATE`);
      if (statusRows[0]?.status === 'COMPLETED' || statusRows[0]?.status === 'CREDIT_CONFIRMED') {
        const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
        if (existing) return { ok: true, status: 'COMPLETED', ledgerId: existing.id, idempotent: true };
      }
      if (statusRows[0]?.status !== 'PENDING_CREDIT') throw new ConflictException(`Deposit is not ready for credit: ${statusRows[0]?.status ?? 'UNKNOWN'}`);

      let wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) wallet = await tx.wallet.create({ data: { userId: request.userId, currency: request.currency } });
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.plus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
      const ledger = await tx.walletLedger.create({ data: { walletId: wallet.id, userId: request.userId, type: 'DEPOSIT', direction: 'CREDIT', amount: request.amount, balanceBefore, balanceAfter, referenceType: 'top_up_request', referenceId: request.id, idempotencyKey, metadata: { workflow: 'slip_review_then_credit', note }, createdByAdminId: adminUserId } });

      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "top_up_requests"
        SET "status" = 'COMPLETED'::"TopUpRequestStatus",
            "credit_confirmed_by" = ${adminUserId}::uuid,
            "credit_confirmed_at" = NOW(),
            "credited_ledger_id" = ${ledger.id}::uuid,
            "reviewed_by" = ${adminUserId}::uuid,
            "reviewed_at" = NOW(),
            "admin_note" = ${note ?? null},
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
          AND "status" = 'PENDING_CREDIT'::"TopUpRequestStatus"
      `);
      if (changed !== 1) throw new ConflictException('Deposit credit state changed during processing');
      await tx.adminAuditLog.create({ data: { adminUserId, action: 'CONFIRM_DEPOSIT_CREDIT', module: 'topups', targetId: requestId, oldData: { status: 'PENDING_CREDIT', balanceBefore: balanceBefore.toString() }, newData: { status: 'COMPLETED', balanceAfter: balanceAfter.toString(), ledgerId: ledger.id }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return { ok: true, status: 'COMPLETED', ledgerId: ledger.id, balanceAfter: balanceAfter.toString() };
    });
  }

  private async findDuplicateMatches(requestId: string, transactionRef: string | null, fileHash: string, perceptualHash: string | null): Promise<DuplicateSlipMatch[]> {
    const rows = await this.prisma.$queryRaw<DuplicateRow[]>(Prisma.sql`
      SELECT "id", "slip_transaction_ref", "slip_file_hash", "slip_perceptual_hash"
      FROM "top_up_requests"
      WHERE "id" <> ${requestId}::uuid
        AND (
          (${transactionRef}::text IS NOT NULL AND "slip_transaction_ref" = ${transactionRef})
          OR "slip_file_hash" = ${fileHash}
          OR (${perceptualHash}::text IS NOT NULL AND "slip_perceptual_hash" = ${perceptualHash})
        )
      ORDER BY "created_at" ASC
      LIMIT 20
    `);
    const matches: DuplicateSlipMatch[] = [];
    for (const row of rows) {
      if (transactionRef && row.slip_transaction_ref === transactionRef) matches.push({ reason: 'TRANSACTION_REFERENCE', originalRequestId: row.id, score: 1 });
      if (row.slip_file_hash === fileHash) matches.push({ reason: 'FILE_HASH', originalRequestId: row.id, score: 1 });
      if (perceptualHash && row.slip_perceptual_hash === perceptualHash) matches.push({ reason: 'PERCEPTUAL_HASH', originalRequestId: row.id, score: 0.95 });
    }
    return matches;
  }

  private async markDuplicate(requestId: string, userId: string, match: DuplicateSlipMatch, transactionRef: string | null, fileHash: string, perceptualHash: string | null) {
    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "top_up_requests"
        SET "status" = 'DUPLICATE'::"TopUpRequestStatus",
            "slip_file_hash" = ${fileHash},
            "slip_perceptual_hash" = ${perceptualHash},
            "slip_transaction_ref" = ${transactionRef},
            "duplicate_of_id" = ${match.originalRequestId}::uuid,
            "duplicate_reason" = ${match.reason},
            "duplicate_match_score" = ${match.score},
            "admin_note" = ${duplicateMemberMessage(match)},
            "reviewed_at" = NOW(),
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
      `);
      const attempts = await tx.$queryRaw<Array<{ in7: bigint; in30: bigint }>>(Prisma.sql`
        SELECT
          COUNT(*) FILTER (WHERE "created_at" >= NOW() - INTERVAL '7 days') AS in7,
          COUNT(*) FILTER (WHERE "created_at" >= NOW() - INTERVAL '30 days') AS in30
        FROM "top_up_requests"
        WHERE "user_id" = ${userId}::uuid AND "status" = 'DUPLICATE'::"TopUpRequestStatus"
      `);
      const risk = duplicateAttemptRisk(Number(attempts[0]?.in7 ?? 0), Number(attempts[0]?.in30 ?? 0));
      if (risk.shouldAlert) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "risk_alerts" ("id", "type", "severity", "status", "member_id", "ref_type", "ref_id", "title", "description", "metadata", "created_at", "updated_at")
          VALUES (
            gen_random_uuid(),
            'REPEATED_DUPLICATE_DEPOSIT_SLIP'::"RiskAlertType",
            ${risk.severity}::"RiskAlertSeverity",
            'OPEN'::"RiskAlertStatus",
            ${userId}::uuid,
            'TOP_UP_REQUEST',
            ${requestId},
            'พบการใช้สลิปซ้ำหลายครั้ง',
            ${`สมาชิกมีประวัติส่งสลิปซ้ำ ระดับ ${risk.severity}`},
            ${JSON.stringify({ duplicateOfId: match.originalRequestId, reason: match.reason, attemptsIn7Days: Number(attempts[0]?.in7 ?? 0), attemptsIn30Days: Number(attempts[0]?.in30 ?? 0), shouldTemporarilyBlockDeposits: risk.shouldTemporarilyBlockDeposits })}::jsonb,
            NOW(),
            NOW()
          )
        `);
      }
    });
  }
}
