import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { Money } from '../../common/domain/value-objects';
import { DomainError } from '../../common/domain/domain-error';
import { CreateTopUpRequestDto } from './dto/create-top-up-request.dto';
import { DepositPolicy, type DepositStatus } from './domain/deposit.policy';

const CLAIM_TIMEOUT_MS = 15 * 60 * 1000;

@Injectable()
export class TopUpsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMemberRequest(userId: string, dto: CreateTopUpRequestDto, idempotencyKey?: string) {
    const requestKey = this.normalizeIdempotencyKey(userId, idempotencyKey);
    const amount = new Decimal(dto.amount ?? 0);
    try {
      DepositPolicy.assertAmount(Money.fromMajor(amount.toFixed(2)));
    } catch (error) {
      this.rethrowDomainError(error);
    }
    await this.validateReceivingAccount(dto.note, dto.method, amount);

    const request = await this.prisma.$transaction(async (tx) => {
      if (requestKey) {
        const existing = await tx.topUpRequest.findUnique({ where: { idempotencyKey: requestKey } });
        if (existing) {
          if (existing.amount.toString() !== amount.toString() || existing.method !== dto.method) throw new ConflictException('Idempotency key was already used with different request data');
          return existing;
        }
      }
      return tx.topUpRequest.create({ data: { userId, amount, currency: 'THB', method: dto.method, referenceCode: dto.referenceCode, note: dto.note, idempotencyKey: requestKey } });
    });
    return this.formatRequest(request);
  }

  async getMemberRequests(userId: string) {
    const items = await this.prisma.topUpRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
    return { items: items.map((item) => this.formatRequest(item)) };
  }

  async getMemberRequest(userId: string, id: string) {
    const request = await this.prisma.topUpRequest.findFirst({ where: { id, userId } });
    if (!request) throw new NotFoundException('Top up request not found');
    return this.formatRequest(request);
  }

  async getAdminRequests(status?: string, paging: { page?: string; take?: string } = {}) {
    await this.releaseExpiredClaims();
    const page = Math.max(Number(paging.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(paging.take ?? 100) || 100, 1), 100);
    const where = status ? { status: status as any } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.topUpRequest.findMany({ where, include: { user: { select: { id: true, username: true, phone: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take }),
      this.prisma.topUpRequest.count({ where }),
    ]);
    return { items: items.map((item) => ({ ...this.formatRequest(item), user: item.user })), page, take, total, pageCount: Math.max(Math.ceil(total / take), 1) };
  }

  async getAdminRequest(id: string) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, phone: true, email: true } } } });
    if (!request) throw new NotFoundException('Top up request not found');
    return { ...this.formatRequest(request), user: request.user };
  }

  async claimRequest(id: string, adminUser: any, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ status: string; claimed_by: string | null; claimed_at: Date | null }>>(Prisma.sql`
        SELECT "status"::text AS status, "claimed_by", "claimed_at"
        FROM "top_up_requests"
        WHERE "id" = ${id}::uuid
        FOR UPDATE
      `);
      const request = rows[0];
      if (!request) throw new NotFoundException('Top up request not found');
      try {
        DepositPolicy.assertClaim(request.status as DepositStatus, request.claimed_by, adminUser.id, request.claimed_at, CLAIM_TIMEOUT_MS);
      } catch (error) {
        this.rethrowDomainError(error, true);
      }
      const updated = await tx.topUpRequest.update({ where: { id }, data: { claimedBy: adminUser.id, claimedAt: new Date() } });
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'CLAIM_TOP_UP', module: 'topups', targetId: id, oldData: { claimedBy: request.claimed_by }, newData: { claimedBy: adminUser.id }, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      return this.formatRequest(updated);
    });
  }

  async releaseRequest(id: string, adminUser: any, meta: RequestMeta = {}) {
    const request = await this.prisma.topUpRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Top up request not found');
    if (request.claimedBy && request.claimedBy !== adminUser.id) throw new ConflictException('ปล่อยงานได้เฉพาะคนที่ claim เท่านั้น');
    const updated = await this.prisma.topUpRequest.update({ where: { id }, data: { claimedBy: null, claimedAt: null } });
    await this.audit(adminUser.id, 'RELEASE_TOP_UP', id, { claimedBy: request.claimedBy }, { claimedBy: null }, meta);
    return this.formatRequest(updated);
  }

  private async validateReceivingAccount(note: string | undefined | null, method: string | undefined | null, amount: Decimal) {
    const proof = this.parseProof(note);
    if (!proof.receivingBankAccountId) return;
    const account = await this.prisma.receivingBankAccount.findUnique({ where: { id: proof.receivingBankAccountId } });
    if (!account || account.status !== 'ACTIVE') throw new BadRequestException('Receiving account is not active');
    const type = this.accountType(account.bankName);
    if (method && type !== method) throw new BadRequestException('Receiving account method mismatch');
    if (account.minAmount && amount.lt(account.minAmount)) throw new BadRequestException('Amount is lower than receiving account minimum');
    if (account.maxAmount && amount.gt(account.maxAmount)) throw new BadRequestException('Amount is higher than receiving account maximum');
  }

  private async releaseExpiredClaims() {
    const staleSince = new Date(Date.now() - CLAIM_TIMEOUT_MS);
    await this.prisma.topUpRequest.updateMany({ where: { status: { in: ['PENDING', 'PENDING_SLIP_REVIEW', 'PENDING_CREDIT'] }, claimedBy: { not: null }, claimedAt: { lt: staleSince } }, data: { claimedBy: null, claimedAt: null } });
  }

  private rethrowDomainError(error: unknown, conflict = false): never {
    if (error instanceof DomainError) {
      if (conflict || error.code === 'RESOURCE_LOCKED' || error.code === 'INVALID_STATE_TRANSITION') throw new ConflictException(error.message);
      throw new BadRequestException(error.message);
    }
    throw error;
  }

  private normalizeIdempotencyKey(userId: string, value?: string | null) { const key = value?.trim(); if (!key) return null; if (key.length > 120) throw new BadRequestException('Idempotency-Key is too long'); return `${userId}:${key}`; }
  private accountType(bankName: string) { if (bankName === 'พร้อมเพย์') return 'promptpay'; if (bankName === 'วอเลต') return 'wallet'; if (bankName === 'อื่น ๆ') return 'other'; return 'bank_transfer'; }
  private audit(adminUserId: string, action: string, targetId: string, oldData: any, newData: any, meta: RequestMeta) { return this.prisma.adminAuditLog.create({ data: { adminUserId, action, module: 'topups', targetId, oldData, newData, ipAddress: meta.ipAddress, userAgent: meta.userAgent } }).catch(() => null); }
  private parseProof(value?: string | null) { if (!value) return {} as { receivingBankAccountId?: string }; try { return JSON.parse(value) as { receivingBankAccountId?: string }; } catch { return {}; } }
  private formatRequest(item: any) { return { id: item.id, userId: item.userId, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, referenceCode: item.referenceCode, note: item.note, adminNote: item.adminNote, reviewedBy: item.reviewedBy, reviewedAt: item.reviewedAt, claimedBy: item.claimedBy, claimedAt: item.claimedAt, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string };
