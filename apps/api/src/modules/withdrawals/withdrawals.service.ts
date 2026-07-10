import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { CreateWithdrawalRequestDto } from './dto/create-withdrawal-request.dto';
import { ReviewWithdrawalRequestDto } from './dto/review-withdrawal-request.dto';

const CLAIM_TIMEOUT_MS = 15 * 60 * 1000;
const BONUS_LEDGER_REF_TYPE = 'BONUS_LEDGER';

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
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      const available = wallet.balance.minus(wallet.lockedBalance);
      if (available.lt(amount)) throw new BadRequestException('Insufficient available balance');
      await tx.wallet.update({ where: { id: wallet.id }, data: { lockedBalance: wallet.lockedBalance.plus(amount) } });
      const request = await tx.withdrawalRequest.create({ data: { userId, amount, currency: wallet.currency, method: dto.method, accountName: dto.accountName, accountNumber: dto.accountNumber, bankName: dto.bankName, note: dto.note } });
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
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Withdrawal request not found');
    if (request.status !== 'PENDING') throw new ConflictException('Withdrawal request is not pending');
    if (request.claimedBy && request.claimedBy !== adminUser.id && request.claimedAt && Date.now() - request.claimedAt.getTime() < CLAIM_TIMEOUT_MS) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
    const updated = await this.prisma.withdrawalRequest.update({ where: { id }, data: { claimedBy: adminUser.id, claimedAt: new Date() } });
    await this.audit(adminUser.id, 'CLAIM_WITHDRAWAL', id, { claimedBy: request.claimedBy }, { claimedBy: adminUser.id }, meta);
    return this.formatRequest(updated);
  }

  async releaseRequest(id: string, adminUser: any, meta: RequestMeta = {}) {
    const request = await this.prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Withdrawal request not found');
    if (request.claimedBy && request.claimedBy !== adminUser.id) throw new ConflictException('ปล่อยงานได้เฉพาะคนที่ claim เท่านั้น');
    const updated = await this.prisma.withdrawalRequest.update({ where: { id }, data: { claimedBy: null, claimedAt: null } });
    await this.audit(adminUser.id, 'RELEASE_WITHDRAWAL', id, { claimedBy: request.claimedBy }, { claimedBy: null }, meta);
    return this.formatRequest(updated);
  }

  async completeRequest(id: string, adminUser: any, dto: ReviewWithdrawalRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (!request.claimedBy) throw new ConflictException('ต้อง claim รายการก่อนดำเนินการ');
      if (request.claimedBy !== adminUser.id) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      if (request.status !== 'PENDING') throw new ConflictException(`Withdrawal request already reviewed: ${request.status}`);
      const ledgerKey = `withdrawal:${request.id}:complete`;
      const existingLedger = await tx.walletLedger.findUnique({ where: { idempotencyKey: ledgerKey } });
      if (existingLedger) throw new ConflictException('Withdrawal ledger already exists');
      const claim = await tx.withdrawalRequest.updateMany({ where: { id, status: 'PENDING', claimedBy: adminUser.id }, data: { status: 'COMPLETED', adminNote: dto.adminNote, reviewedBy: adminUser.id, reviewedAt: new Date(), claimedBy: null, claimedAt: null } });
      if (claim.count !== 1) throw new ConflictException('Withdrawal request already reviewed');
      const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.lockedBalance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');
      if (wallet.balance.lt(request.amount)) throw new BadRequestException('Balance is not enough');
      const balanceBefore = wallet.balance; const balanceAfter = balanceBefore.minus(request.amount); const lockedAfter = wallet.lockedBalance.minus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter, lockedBalance: lockedAfter } });
      await tx.walletLedger.create({ data: { walletId: wallet.id, userId: request.userId, type: 'WITHDRAWAL', direction: 'DEBIT', amount: request.amount, balanceBefore, balanceAfter, referenceType: 'withdrawal_request', referenceId: request.id, idempotencyKey: ledgerKey, metadata: { method: request.method, accountName: request.accountName, bankName: request.bankName }, createdByAdminId: adminUser.id } });
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'COMPLETE_WITHDRAWAL', module: 'withdrawals', targetId: request.id, oldData: { status: request.status, amount: request.amount.toString() } as any, newData: { status: 'COMPLETED', balanceBefore: balanceBefore.toString(), balanceAfter: balanceAfter.toString(), lockedAfter: lockedAfter.toString(), idempotencyKey: ledgerKey } as any, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      const updated = await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  async rejectRequest(id: string, adminUser: any, dto: ReviewWithdrawalRequestDto, meta: RequestMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Withdrawal request not found');
      if (!request.claimedBy) throw new ConflictException('ต้อง claim รายการก่อนปฏิเสธ');
      if (request.claimedBy !== adminUser.id) throw new ConflictException('รายการนี้มีแอดมินคนอื่นกำลังตรวจอยู่');
      if (request.status !== 'PENDING') throw new ConflictException(`Withdrawal request already reviewed: ${request.status}`);
      const claim = await tx.withdrawalRequest.updateMany({ where: { id, status: 'PENDING', claimedBy: adminUser.id }, data: { status: 'REJECTED', adminNote: dto.adminNote, reviewedBy: adminUser.id, reviewedAt: new Date(), claimedBy: null, claimedAt: null } });
      if (claim.count !== 1) throw new ConflictException('Withdrawal request already reviewed');
      const wallet = await tx.wallet.findUnique({ where: { userId: request.userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      if (wallet.lockedBalance.lt(request.amount)) throw new BadRequestException('Locked balance is not enough');
      const lockedAfter = wallet.lockedBalance.minus(request.amount);
      await tx.wallet.update({ where: { id: wallet.id }, data: { lockedBalance: lockedAfter } });
      await tx.adminAuditLog.create({ data: { adminUserId: adminUser.id, action: 'REJECT_WITHDRAWAL', module: 'withdrawals', targetId: request.id, oldData: { status: request.status, amount: request.amount.toString() } as any, newData: { status: 'REJECTED', adminNote: dto.adminNote, lockedAfter: lockedAfter.toString() } as any, ipAddress: meta.ipAddress, userAgent: meta.userAgent } });
      const updated = await tx.withdrawalRequest.findUniqueOrThrow({ where: { id } });
      return this.formatRequest(updated);
    });
  }

  private bonusMetadata(value: unknown) { const data = value && typeof value === 'object' && !Array.isArray(value) ? value as any : {}; return { turnoverRequired: Number(data.turnoverRequired ?? 0), turnoverProgress: Number(data.turnoverProgress ?? 0), turnoverCompleted: data.turnoverCompleted === true }; }
  private async releaseExpiredClaims() { const staleSince = new Date(Date.now() - CLAIM_TIMEOUT_MS); await this.prisma.withdrawalRequest.updateMany({ where: { status: 'PENDING', claimedBy: { not: null }, claimedAt: { lt: staleSince } }, data: { claimedBy: null, claimedAt: null } }); }
  private audit(adminUserId: string, action: string, targetId: string, oldData: any, newData: any, meta: RequestMeta) { return this.prisma.adminAuditLog.create({ data: { adminUserId, action, module: 'withdrawals', targetId, oldData, newData, ipAddress: meta.ipAddress, userAgent: meta.userAgent } }).catch(() => null); }
  private formatRequest(item: any) { return { id: item.id, userId: item.userId, amount: item.amount.toString(), currency: item.currency, status: item.status, method: item.method, accountName: item.accountName, accountNumber: item.accountNumber, bankName: item.bankName, note: item.note, adminNote: item.adminNote, reviewedBy: item.reviewedBy, reviewedAt: item.reviewedAt, claimedBy: item.claimedBy, claimedAt: item.claimedAt, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
}

export type RequestMeta = { ipAddress?: string; userAgent?: string };
