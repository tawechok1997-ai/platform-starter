import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { ReviewWithdrawalRequestDto } from './dto/review-withdrawal-request.dto';
import { CompleteWithdrawalRequestDto } from './dto/complete-withdrawal-request.dto';

const CLAIM_TIMEOUT_MS = 15 * 60 * 1000;
const BONUS_LEDGER_REF_TYPE = 'BONUS_LEDGER';

type LockedWalletRow = {
  id: string;
  user_id: string;
  currency: string;
  status: string;
  balance: Prisma.Decimal;
  locked_balance: Prisma.Decimal;
};

@Injectable()
export class WithdrawalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemberRequest(userId: string, dto: CreateWithdrawalRequestDto) {
    const amount = new Decimal(dto.amount ?? 0);
    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');
    if (!dto.accountName || !dto.accountNumber || !dto.bankName) throw new BadRequestException('Withdrawal bank account is required');
    return this.prisma.$transaction(async (tx) => {
      const activeBonus = await tx.riskAlert.findFirst({ where: { refType: BONUS_LEDGER_REF_TYPE, memberId: userId, status: { in: ['OPEN', 'REVIEWING'] } }, orderBy: { createdAt: 'desc' } });
      if (activeBonus) {
        const metadata = this.bonusMetadata(activeBonus.metadata);
        const remaining = Math.max(metadata.turnoverRequired - metadata.turnoverProgress, 0);
        if (!metadata.turnoverCompleted && remaining > 0) throw new BadRequestException(`ยังถอนเงินไม่ได้ เพราะมีโบนัสที่ต้องทำเทิร์นคงเหลือ ${remaining.toLocaleString('th-TH', { minimumFractionDigits: 2 })} THB`);
      }
      const approvedBank = await tx.memberBankAccount.findFirst({ where: { userId, status: 'ACTIVE', bankName: dto.bankName, accountName: dto.accountName, accountNumber: dto.accountNumber } });
      if (!approvedBank) throw new BadRequestException('กรุณาใช้บัญชีถอนเงินที่แอดมินอนุมัติแล้วเท่านั้น');

      const walletRows = await tx.$queryRaw<LockedWalletRow[]>(Prisma.sql`
        SELECT "id", "user_id", "currency", "status"::text AS status, "balance", "locked_balance"
        FROM "wallets"
        WHERE "user_id" = ${userId}::uuid
        FOR UPDATE
      `);
      const wallet = walletRows[0];
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      const available = wallet.balance.minus(wallet.locked_balance);
      if (available.lt(amount)) throw new BadRequestException('Insufficient available balance');
      const lockedAfter = wallet.locked_balance.plus(amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { lockedBalance: lockedAfter } });

      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        INSERT INTO "withdrawal_requests" (
          "id", "user_id", "amount", "currency", "status", "method",
          "account_name", "account_number", "bank_name", "note", "created_at", "updated_at"
        ) VALUES (
          gen_random_uuid(), ${userId}::uuid, ${amount.toString()}::decimal, ${wallet.currency},
          'PENDING_REVIEW'::"WithdrawalRequestStatus", ${dto.method ?? null},
          ${dto.accountName}, ${dto.accountNumber}, ${dto.bankName}, ${dto.note ?? null}, NOW(), NOW()
        )
        RETURNING "id"
      `);
      const request = await tx.withdrawalRequest.findUniqueOrThrow({ where: { id: rows[0].id } });
      return this.formatRequest(request);
    });
  }

  async getMemberRequests(userId: string) { const items = await this.prisma.withdrawalRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }); return { items: items.map((item) => this.formatRequest(item)) }; }
  async getMemberRequest(userId: string, id: string) { const request = await this.prisma.withdrawalRequest.findFirst({ where: { id, userId } }); if (!request) throw new NotFoundException('Withdrawal request not found'); return this.formatRequest(request); }

  async getAdminRequests(status?: string, paging: { page?: string; take?: string } = {}) {
    await this.releaseExpiredClaims();
    const page = Math.max(Number(paging.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(paging.take ?? 100) || 100, 1), 100);
    const where = status ? { status: status as any } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.withdrawalRequest.findMany({ where, include: { user: { select: { id: true, username: true, phone: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take }),
      this.prisma.withdrawalRequest.count({ where }),
    ]);
    return { items: items.map((item) => ({ ...this.formatRequest(item), user: item.user })), page, take, total, pageCount: Math.max(Math.ceil(total / take), 1) };
  }

  async getAdminRequest(id: string) { const request = await this.prisma.withdrawalRequest.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, phone: true, email: true } } } }); if (!request) throw new NotFoundException('Withdrawal request not found'); return { ...this.formatRequest(request), user: request.user }; }

  async claimRequest(id: string, adminUser: any, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; claimed_by: string | null; claimed_at: Date | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "claimed_by", "claimed_at"
        FROM "withdrawal_requests"
        WHERE "id" = ${id}::uuid
        FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (!['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(request.status)) throw new ConflictException('Withdrawal request is not available for claim');
      if (request.claimed_by && request.claimed_by !== adminUser.id && request.claimed_at && Date.now() - request.claimed_at.getTime() < CLAIM_TIMEOUT_MS) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      const updated = await tx.withdrawalRequest.update({ where: { id }, data: { claimedBy: adminUser.id, claimedAt: new Date() } });
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'CLAIM_WITHDRAWAL', module: 'withdrawals', targetId: id, oldData: { claimedBy: request.claimed_by }, newData: { claimedBy: adminUser.id }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return this.formatRequest(updated);
    });
  }

  async releaseRequest(id: string, adminUser: any, meta: RequestMeta = {}) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Withdrawal request not found');
    if (request.claimedBy && request.claimedBy !== adminUser.id) throw new ConflictException('ปล่อยงานได้เฉพาะคนที่ claim เท่านั้น');
    const updated = await this.prisma.withdrawalRequest.update({ where: { id }, data: { claimedBy: null, claimedAt: null } });
    await this.audit(adminUser.id, 'RELEASE_WITHDRAWAL', id, { claimedBy: request.claimedBy }, { claimedBy: null }, meta);
    return this.formatRequest(updated);
  }


  async approveRequest(id: string, adminUser: any, dto: ReviewWithdrawalRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; claimed_by: string | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "claimed_by" FROM "withdrawal_requests" WHERE "id" = ${id}::uuid FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (request.claimed_by && request.claimed_by !== adminUser.id) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      if (!['PENDING', 'PENDING_REVIEW'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be approved: ${request.status}`);
      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "withdrawal_requests"
        SET "status" = 'APPROVED_FOR_PAYMENT'::"WithdrawalRequestStatus", "admin_note" = ${dto.adminNote ?? null},
            "reviewed_by" = ${adminUser.id}::uuid, "reviewed_at" = NOW(),
            "approved_for_payment_by" = ${adminUser.id}::uuid, "approved_for_payment_at" = NOW(),
            "claimed_by" = NULL, "claimed_at" = NULL, "updated_at" = NOW()
        WHERE "id" = ${id}::uuid AND "status"::text IN ('PENDING', 'PENDING_REVIEW')
      `);
      if (changed !== 1) throw new ConflictException('Withdrawal state changed during approval');
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'APPROVE_WITHDRAWAL', module: 'withdrawals', targetId: id, oldData: { status: request.status }, newData: { status: 'APPROVED_FOR_PAYMENT', adminNote: dto.adminNote }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return this.formatRequest(await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } }));
    });
  }

  async completeRequest(id: string, adminUser: any, dto: CompleteWithdrawalRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; user_id: string; amount: Prisma.Decimal; claimed_by: string | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "user_id", "amount", "claimed_by"
        FROM "withdrawal_requests" WHERE "id" = ${id}::uuid FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (request.claimed_by && request.claimed_by !== adminUser.id) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      if (!['APPROVED_FOR_PAYMENT', 'PAYMENT_VERIFIED'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be completed: ${request.status}`);
      const walletRows = await tx.$queryRaw<LockedWalletRow[]>(Prisma.sql`
        SELECT "id", "user_id", "currency", "status"::text AS status, "balance", "locked_balance"
        FROM "wallets" WHERE "user_id" = ${request.user_id}::uuid FOR UPDATE
      `);
      const wallet = walletRows[0];
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      if (wallet.locked_balance.lt(request.amount) || wallet.balance.lt(request.amount)) throw new BadRequestException('Wallet balance is not enough to complete withdrawal');
      const balanceAfter = wallet.balance.minus(request.amount);
      const lockedAfter = wallet.locked_balance.minus(request.amount);
      const ledger = await tx.walletLedger.create({
        data: {
          walletId: wallet.id, userId: request.user_id, type: 'WITHDRAWAL', direction: 'DEBIT',
          amount: request.amount, balanceBefore: wallet.balance, balanceAfter,
          referenceType: 'WITHDRAWAL_REQUEST', referenceId: id,
          idempotencyKey: `withdrawal:${id}:complete`,
          metadata: { paymentTransactionRef: dto.paymentTransactionRef },
          createdByAdminId: adminUser.id,
        },
      });
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter, lockedBalance: lockedAfter } });
      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "withdrawal_requests"
        SET "status" = 'COMPLETED'::"WithdrawalRequestStatus", "admin_note" = ${dto.adminNote ?? null},
            "payment_transaction_ref" = ${dto.paymentTransactionRef}, "payment_verified_by" = ${adminUser.id}::uuid,
            "payment_verified_at" = NOW(), "reviewed_by" = ${adminUser.id}::uuid, "reviewed_at" = NOW(),
            "completed_ledger_id" = ${ledger.id}::uuid, "claimed_by" = NULL, "claimed_at" = NULL, "updated_at" = NOW()
        WHERE "id" = ${id}::uuid AND "status"::text IN ('APPROVED_FOR_PAYMENT', 'PAYMENT_VERIFIED')
      `);
      if (changed !== 1) throw new ConflictException('Withdrawal state changed during completion');
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'COMPLETE_WITHDRAWAL', module: 'withdrawals', targetId: id, oldData: { status: request.status, amount: request.amount.toString() }, newData: { status: 'COMPLETED', ledgerId: ledger.id, paymentTransactionRef: dto.paymentTransactionRef }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return this.formatRequest(await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } }));
    });
  }

  async rejectRequest(id: string, adminUser: any, dto: ReviewWithdrawalRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; user_id: string; amount: Prisma.Decimal; claimed_by: string | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "user_id", "amount", "claimed_by"
        FROM "withdrawal_requests" WHERE "id" = ${id}::uuid FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (request.claimed_by && request.claimed_by !== adminUser.id) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      if (!['PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED'].includes(request.status)) throw new ConflictException(`Withdrawal cannot be rejected: ${request.status}`);

      const walletRows = await tx.$queryRaw<LockedWalletRow[]>(Prisma.sql`
        SELECT "id", "user_id", "currency", "status"::text AS status, "balance", "locked_balance"
        FROM "wallets"
        WHERE "user_id" = ${request.user_id}::uuid
        FOR UPDATE
      `);
      const wallet = walletRows[0];
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.locked_balance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');
      const lockedAfter = wallet.locked_balance.minus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { lockedBalance: lockedAfter } });

      const changed = await tx.$executeRaw(Prisma.sql`
        UPDATE "withdrawal_requests"
        SET "status" = 'REJECTED'::"WithdrawalRequestStatus", "admin_note" = ${dto.adminNote ?? null},
            "reviewed_by" = ${adminUser.id}::uuid, "reviewed_at" = NOW(),
            "claimed_by" = NULL, "claimed_at" = NULL, "updated_at" = NOW()
        WHERE "id" = ${id}::uuid AND "status"::text IN ('PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED')
      `);
      if (changed !== 1) throw new ConflictException('Withdrawal state changed during rejection');
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'REJECT_WITHDRAWAL', module: 'withdrawals', targetId: id, oldData: { status: request.status, amount: request.amount.toString() } as any, newData: { status: 'REJECTED', adminNote: dto.adminNote, lockedAfter: lockedAfter.toString() } as any, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      const updated = await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  private bonusMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { turnoverRequired: Number(data.turnoverRequired ?? 0), turnoverProgress: Number(data.turnoverProgress ?? 0), turnoverCompleted: data.turnoverCompleted === true }; }
  private async releaseExpiredClaims() { const staleSince = new Date(Date.now() - CLAIM_TIMEOUT_MS); await this.prisma.$executeRaw(Prisma.sql`UPDATE "withdrawal_requests" SET "claimed_by" = NULL, "claimed_at" = NULL WHERE "status"::text IN ('PENDING', 'PENDING_REVIEW', 'APPROVED_FOR_PAYMENT', 'PAYMENT_PROOF_UPLOADED') AND "claimed_by" IS NOT NULL AND "claimed_at" < ${staleSince}`); }
  private audit(adminUserId: string, action: string, targetId: string, oldData: any, newData: any, meta: RequestMeta) { return this.prisma.adminAuditLog.create({ data: { adminUserId, action, module: 'withdrawals', targetId, oldData, newData, ipAddress: meta.ipAddress, userAgent: meta.userAgent } }).catch(() => null); }
  private formatRequest(item: any) { return { id: item.id, userId: item.userId, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, accountName: item.accountName, accountNumber: item.accountNumber, bankName: item.bankName, note: item.note, adminNote: item.adminNote, reviewedBy: item.reviewedBy, reviewedAt: item.reviewedAt, claimedBy: item.claimedBy, claimedAt: item.claimedAt, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string };
