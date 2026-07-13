import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  chooseStrongestDuplicateMatch,
  duplicateAttemptRisk,
  duplicateMemberMessage,
  DuplicateSlipMatch,
} from '../finance/deposit-slip-risk.policy';

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

type LockedWalletRow = {
  id: string;
  user_id: string;
  currency: string;
  status: string;
  balance: Prisma.Decimal;
  locked_balance: Prisma.Decimal;
};

type EvidenceRow = {
  id: string;
  status: string;
  slip_url: string | null;
  slip_file_hash: string | null;
  slip_transaction_ref: string | null;
  slip_detected_amount: string | null;
  slip_transferred_at: Date | null;
  duplicate_of_id: string | null;
  duplicate_reason: string | null;
  duplicate_match_score: string | null;
};

@Injectable()
export class DepositWorkflowService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async submitEvidence(requestId: string, userId: string, input: DepositEvidenceInput) {
    const request = await this.prisma.topUpRequest.findFirst({ where: { id: requestId, userId } });
    if (!request) throw new NotFoundException('Top up request not found');
    if (String(request.status) !== 'PENDING') throw new ConflictException(`Top up request cannot accept slip: ${request.status}`);

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
    const strongest = chooseStrongestDuplicateMatch(
      await this.findDuplicateMatches(requestId, transactionRef, fileHash, perceptualHash),
    );
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

    const detectedAmount = input.detectedAmount && Number.isFinite(Number(input.detectedAmount))
      ? Number(input.detectedAmount)
      : null;
    const transferredAt = input.transferredAt ? new Date(input.transferredAt) : null;
    if (transferredAt && Number.isNaN(transferredAt.getTime())) throw new BadRequestException('Invalid transferredAt');

    const ext = match[2] === 'jpeg' ? 'jpg' : match[2];
    const key = `slips/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    await this.storage.put(key, buffer, match[1]);
    try {
      const changed = await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "top_up_requests"
        SET "status" = 'PENDING_SLIP_REVIEW'::"TopUpRequestStatus",
            "slip_url" = ${key},
            "slip_file_hash" = ${fileHash},
            "slip_perceptual_hash" = ${perceptualHash},
            "slip_transaction_ref" = ${transactionRef},
            "slip_detected_amount" = ${detectedAmount},
            "slip_transferred_at" = ${transferredAt},
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
          AND "user_id" = ${userId}::uuid
          AND "status" = 'PENDING'::"TopUpRequestStatus"
      `);
      if (changed !== 1) throw new ConflictException('Top up request state changed while submitting evidence');
    } catch (error) {
      await this.storage.remove(key).catch(() => undefined);
      throw error;
    }

    return { ok: true, duplicate: false, status: 'PENDING_SLIP_REVIEW' };
  }

  async getSlip(requestId: string) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id: requestId }, select: { slipUrl: true } });
    if (!request) throw new NotFoundException('Top up request not found');
    if (!request.slipUrl) throw new NotFoundException('Slip file not found');
    const stored = await this.storage.get(request.slipUrl, this.contentTypeFromKey(request.slipUrl));
    return { dataUrl: `data:${stored.contentType};base64,${stored.data.toString('base64')}` };
  }

  async approveSlip(requestId: string, adminUserId: string, note: string | undefined, meta: DepositWorkflowMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; claimed_by: string | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "claimed_by"
        FROM "top_up_requests"
        WHERE "id" = ${requestId}::uuid
        FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Top up request not found');
      if (!request.claimed_by) throw new ConflictException('ต้อง claim รายการก่อนตรวจสลิป');
      if (request.claimed_by !== adminUserId) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      if (request.status !== 'PENDING_SLIP_REVIEW') throw new ConflictException(`Slip is not waiting for review: ${request.status}`);
      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "top_up_requests"
        SET "status" = 'PENDING_CREDIT'::"TopUpRequestStatus",
            "slip_reviewed_by" = ${adminUserId}::uuid,
            "slip_reviewed_at" = NOW(),
            "admin_note" = ${note ?? null},
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
          AND "claimed_by" = ${adminUserId}::uuid
          AND "status" = 'PENDING_SLIP_REVIEW'::"TopUpRequestStatus"
      `);
      if (changed !== 1) throw new ConflictException('Deposit state or claim changed during slip approval');
      await tx.adminAuditLog.create({ data: { adminUserId, action: 'APPROVE_DEPOSIT_SLIP', module: 'topups', targetId: requestId, oldData: { status: 'PENDING_SLIP_REVIEW' }, newData: { status: 'PENDING_CREDIT', note }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return { ok: true, status: 'PENDING_CREDIT' };
    });
  }

  async rejectDeposit(requestId: string, adminUserId: string, note: string | undefined, meta: DepositWorkflowMeta = {}) {
    if (!note?.trim()) throw new BadRequestException('Rejection reason is required');
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; claimed_by: string | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "claimed_by"
        FROM "top_up_requests"
        WHERE "id" = ${requestId}::uuid
        FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Top up request not found');
      if (!request.claimed_by) throw new ConflictException('ต้อง claim รายการก่อนปฏิเสธ');
      if (request.claimed_by !== adminUserId) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      if (!['PENDING_SLIP_REVIEW', 'PENDING_CREDIT'].includes(request.status)) throw new ConflictException(`Deposit cannot be rejected: ${request.status}`);
      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "top_up_requests"
        SET "status" = 'REJECTED'::"TopUpRequestStatus",
            "admin_note" = ${note.trim()},
            "reviewed_by" = ${adminUserId}::uuid,
            "reviewed_at" = NOW(),
            "claimed_by" = NULL,
            "claimed_at" = NULL,
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
          AND "status"::text IN ('PENDING_SLIP_REVIEW', 'PENDING_CREDIT')
      `);
      if (changed !== 1) throw new ConflictException('Deposit state changed during rejection');
      await tx.adminAuditLog.create({ data: { adminUserId, action: 'REJECT_DEPOSIT', module: 'topups', targetId: requestId, oldData: { status: request.status }, newData: { status: 'REJECTED', note: note.trim() }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return { ok: true, status: 'REJECTED' };
    });
  }

  async confirmCredit(requestId: string, adminUserId: string, note: string | undefined, meta: DepositWorkflowMeta = {}) {
    const idempotencyKey = `topup:${requestId}:credit-confirmed`;
    return this.prisma.$transaction(async (tx) => {
      const requestRows = await tx.$queryRaw<Array<{ status: string; user_id: string; amount: Prisma.Decimal; currency: string; claimed_by: string | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "user_id", "amount", "currency", "claimed_by"
        FROM "top_up_requests"
        WHERE "id" = ${requestId}::uuid
        FOR UPDATE
      `);
      const request = requestRows[0];
      if (!request) throw new NotFoundException('Top up request not found');
      if (request.status === 'COMPLETED' || request.status === 'CREDIT_CONFIRMED') {
        const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
        if (existing) return { ok: true, status: 'COMPLETED', ledgerId: existing.id, idempotent: true };
      }
      this.assertClaimOwner(request.claimed_by, adminUserId);
      if (request.status !== 'PENDING_CREDIT') throw new ConflictException(`Deposit is not ready for credit: ${request.status}`);
      if (!request.claimed_by) throw new ConflictException('ต้อง claim รายการก่อนยืนยันเครดิต');
      if (request.claimed_by !== adminUserId) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');

      await tx.wallet.upsert({ where: { userId: request.user_id }, create: { userId: request.user_id, currency: request.currency }, update: {} });
      const walletRows = await tx.$queryRaw<LockedWalletRow[]>(Prisma.sql`
        SELECT "id", "user_id", "currency", "status"::text AS status, "balance", "locked_balance"
        FROM "wallets"
        WHERE "user_id" = ${request.user_id}::uuid
        FOR UPDATE
      `);
      const wallet = walletRows[0];
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
      if (existing) return { ok: true, status: 'COMPLETED', ledgerId: existing.id, idempotent: true };

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore.plus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
      const ledger = await tx.walletLedger.create({ data: { walletId: wallet.id, userId: request.user_id, type: 'DEPOSIT', direction: 'CREDIT', amount: request.amount, balanceBefore, balanceAfter, referenceType: 'top_up_request', referenceId: requestId, idempotencyKey, metadata: { workflow: 'slip_review_then_credit', note }, createdByAdminId: adminUserId } });

      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "top_up_requests"
        SET "status" = 'COMPLETED'::"TopUpRequestStatus",
            "credit_confirmed_by" = ${adminUserId}::uuid,
            "credit_confirmed_at" = NOW(),
            "credited_ledger_id" = ${ledger.id}::uuid,
            "reviewed_by" = ${adminUserId}::uuid,
            "reviewed_at" = NOW(),
            "admin_note" = ${note ?? null},
            "claimed_by" = NULL,
            "claimed_at" = NULL,
            "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid
          AND "claimed_by" = ${adminUserId}::uuid
          AND "status" = 'PENDING_CREDIT'::"TopUpRequestStatus"
      `);
      if (changed !== 1) throw new ConflictException('Deposit state or claim changed during credit confirmation');
      await tx.adminAuditLog.create({ data: { adminUserId, action: 'CONFIRM_DEPOSIT_CREDIT', module: 'topups', targetId: requestId, oldData: { status: 'PENDING_CREDIT', balanceBefore: balanceBefore.toString() }, newData: { status: 'COMPLETED', balanceAfter: balanceAfter.toString(), ledgerId: ledger.id }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return { ok: true, status: 'COMPLETED', ledgerId: ledger.id, balanceAfter: balanceAfter.toString() };
    });
  }

  private async findDuplicateMatches(requestId: string, transactionRef: string | null, fileHash: string, perceptualHash: string | null): Promise<DuplicateSlipMatch[]> {
    const rows = await this.prisma.$queryRaw<DuplicateRow[]>(Prisma.sql`
      SELECT "id", "slip_transaction_ref", "slip_file_hash", "slip_perceptual_hash"
      FROM "top_up_requests"
      WHERE "id" <> ${requestId}::uuid
        AND ((${transactionRef}::text IS NOT NULL AND "slip_transaction_ref" = ${transactionRef})
          OR "slip_file_hash" = ${fileHash}
          OR (${perceptualHash}::text IS NOT NULL AND "slip_perceptual_hash" = ${perceptualHash}))
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
      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "top_up_requests"
        SET "status" = 'DUPLICATE'::"TopUpRequestStatus", "slip_file_hash" = ${fileHash},
            "slip_perceptual_hash" = ${perceptualHash}, "slip_transaction_ref" = ${transactionRef},
            "duplicate_of_id" = ${match.originalRequestId}::uuid, "duplicate_reason" = ${match.reason},
            "duplicate_match_score" = ${match.score}, "admin_note" = ${duplicateMemberMessage(match)},
            "reviewed_at" = NOW(), "updated_at" = NOW()
        WHERE "id" = ${requestId}::uuid AND "user_id" = ${userId}::uuid
          AND "status" = 'PENDING'::"TopUpRequestStatus"
      `);
      if (changed !== 1) throw new ConflictException('Top up request state changed while marking duplicate');
      const attempts = await tx.$queryRaw<Array<{ in7: bigint; in30: bigint }>>(Prisma.sql`
        SELECT COUNT(*) FILTER (WHERE "created_at" >= NOW() - INTERVAL '7 days') AS in7,
               COUNT(*) FILTER (WHERE "created_at" >= NOW() - INTERVAL '30 days') AS in30
        FROM "top_up_requests"
        WHERE "user_id" = ${userId}::uuid AND "status" = 'DUPLICATE'::"TopUpRequestStatus"
      `);
      const risk = duplicateAttemptRisk(Number(attempts[0]?.in7 ?? 0), Number(attempts[0]?.in30 ?? 0));
      if (risk.shouldAlert) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "risk_alerts" ("id", "type", "severity", "status", "member_id", "ref_type", "ref_id", "title", "description", "metadata", "created_at", "updated_at")
          VALUES (gen_random_uuid(), 'REPEATED_DUPLICATE_DEPOSIT_SLIP'::"RiskAlertType", ${risk.severity}::"RiskAlertSeverity", 'OPEN'::"RiskAlertStatus", ${userId}::uuid, 'TOP_UP_REQUEST', ${requestId}, 'พบการใช้สลิปซ้ำหลายครั้ง', ${`สมาชิกมีประวัติส่งสลิปซ้ำ ระดับ ${risk.severity}`}, ${JSON.stringify({ duplicateOfId: match.originalRequestId, reason: match.reason, attemptsIn7Days: Number(attempts[0]?.in7 ?? 0), attemptsIn30Days: Number(attempts[0]?.in30 ?? 0), shouldTemporarilyBlockDeposits: risk.shouldTemporarilyBlockDeposits })}::jsonb, NOW(), NOW())
        `);
      }
    });
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
