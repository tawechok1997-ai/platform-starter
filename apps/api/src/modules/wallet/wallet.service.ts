import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { AdjustWalletDto } from './dto/adjust-wallet.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberWallet(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return this.formatWallet(wallet);
  }

  async getMemberLedger(userId: string, limit = 50, query: MemberLedgerQuery = {}) {
    const wallet = await this.ensureWallet(userId);
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const requiresSemanticFilter = Boolean(query.operation || query.provider || query.gameCode || query.roundId);
    const ledgers = await this.prisma.walletLedger.findMany({
      where: { walletId: wallet.id, userId },
      orderBy: { createdAt: 'desc' },
      take: requiresSemanticFilter ? 500 : safeLimit,
    });
    const formatted = ledgers.map((ledger) => this.formatLedger(ledger));
    const filtered = this.filterFormattedLedgers(formatted, query);
    return { walletId: wallet.id, items: filtered.slice(0, safeLimit), filters: this.normalizeLedgerFilters(query) };
  }

  async getAdminLedgers(query: AdminLedgerQuery) {
    const page = Math.max(Number(query.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(query.take ?? query.limit ?? 100) || 100, 1), 100);
    const identifier = (query.identifier || query.userId || '').trim();
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.direction) where.direction = query.direction;
    const requiresApplicationFilter = Boolean(identifier || query.operation || query.provider || query.gameCode || query.roundId);

    if (requiresApplicationFilter) {
      const items = await this.prisma.walletLedger.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, phone: true, email: true } },
          wallet: { select: { id: true, userId: true, currency: true, balance: true, lockedBalance: true, status: true, updatedAt: true } },
          createdByAdmin: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      });
      const filtered = items
        .filter((item) => !identifier || this.matchesIdentifier(identifier, item.user, item.userId))
        .map((item) => this.formatAdminLedger(item))
        .filter((item) => this.matchesLedgerFilters(item, query));
      const pageItems = filtered.slice((page - 1) * take, page * take);
      return { items: pageItems, page, take, total: filtered.length, pageCount: Math.max(Math.ceil(filtered.length / take), 1), filters: this.normalizeLedgerFilters(query) };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.walletLedger.findMany({ where, include: { user: { select: { id: true, username: true, phone: true, email: true } }, wallet: { select: { id: true, userId: true, currency: true, balance: true, lockedBalance: true, status: true, updatedAt: true } }, createdByAdmin: { select: { id: true, username: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * take, take }),
      this.prisma.walletLedger.count({ where }),
    ]);
    return { items: items.map((item) => this.formatAdminLedger(item)), page, take, total, pageCount: Math.max(Math.ceil(total / take), 1), filters: this.normalizeLedgerFilters(query) };
  }

  async getAdminWallets(query: AdminWalletQuery) {
    const page = Math.max(Number(query.page ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(query.take ?? query.limit ?? 100) || 100, 1), 100);
    const search = query.search?.trim();

    if (search) {
      const wallets = await this.prisma.wallet.findMany({ include: { user: { select: { id: true, username: true, phone: true, email: true, status: true } } }, orderBy: { updatedAt: 'desc' }, take: 500 });
      const filtered = wallets.filter((wallet) => this.matchesIdentifier(search, wallet.user, wallet.userId));
      const pageItems = filtered.slice((page - 1) * take, page * take);
      return { items: pageItems.map((wallet) => ({ ...this.formatWallet(wallet), user: wallet.user ? { ...wallet.user, shortId: this.shortId(wallet.user.id) } : null })), page, take, total: filtered.length, pageCount: Math.max(Math.ceil(filtered.length / take), 1) };
    }

    const [wallets, total] = await this.prisma.$transaction([
      this.prisma.wallet.findMany({ include: { user: { select: { id: true, username: true, phone: true, email: true, status: true } } }, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * take, take }),
      this.prisma.wallet.count(),
    ]);
    return { items: wallets.map((wallet) => ({ ...this.formatWallet(wallet), user: wallet.user ? { ...wallet.user, shortId: this.shortId(wallet.user.id) } : null })), page, take, total, pageCount: Math.max(Math.ceil(total / take), 1) };
  }

  async getAdminWalletDetail(userId: string) {
    const wallet = await this.ensureWallet(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, phone: true, email: true, status: true, createdAt: true } });
    const ledgers = await this.prisma.walletLedger.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 });
    return { wallet: this.formatWallet(wallet), user: user ? { ...user, shortId: this.shortId(user.id) } : null, ledgers: ledgers.map((ledger) => this.formatLedger(ledger)) };
  }

  async adjustWallet(userId: string, adminUser: any, dto: AdjustWalletDto, meta: RequestMeta = {}) {
    const amount = new Decimal(dto.amount ?? 0);
    const reason = dto.reason?.trim();
    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');
    if (!reason) throw new BadRequestException('Reason is required');

    const clientKey = dto.idempotencyKey?.trim();
    const idempotencyKey = clientKey ? `adjust:${userId}:${clientKey}` : `adjust:${userId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

    return this.prisma.$transaction(async (tx) => {
      const existingLedger = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
      if (existingLedger) throw new ConflictException('Manual adjustment already submitted');

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      const wallet = await tx.wallet.upsert({ where: { userId }, update: {}, create: { userId, currency: 'THB' } });
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');

      const balanceBefore = wallet.balance;
      const balanceAfter = dto.direction === 'CREDIT' ? balanceBefore.plus(amount) : balanceBefore.minus(amount);
      if (balanceAfter.lt(0)) throw new BadRequestException('Balance cannot be negative');
      if (dto.direction === 'DEBIT' && balanceAfter.lt(wallet.lockedBalance)) throw new BadRequestException('Balance cannot be lower than locked balance');

      const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
      const ledger = await tx.walletLedger.create({ data: { walletId: wallet.id, userId, type: 'ADJUSTMENT', direction: dto.direction, amount, balanceBefore, balanceAfter, referenceType: 'manual_adjustment', referenceId: wallet.id, idempotencyKey, metadata: { reason }, createdByAdminId: adminUser.id } });

      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: adminUser.id,
          action: 'ADJUST_WALLET',
          module: 'wallets',
          targetId: wallet.id,
          oldData: { balance: balanceBefore.toString(), lockedBalance: wallet.lockedBalance.toString() },
          newData: { direction: dto.direction, amount: amount.toString(), balanceAfter: balanceAfter.toString(), reason, idempotencyKey },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });

      return { wallet: this.formatWallet(updatedWallet), ledger: this.formatLedger(ledger) };
    });
  }

  async mutateGameBalance(input: GameWalletMutationInput) {
    const userId = input.userId.trim();
    const idempotencyKey = `game:${input.idempotencyKey.trim()}`;
    const amount = new Decimal(input.amount);
    if (!userId) throw new BadRequestException('userId is required');
    if (!input.idempotencyKey.trim()) throw new BadRequestException('idempotencyKey is required');
    if (!input.referenceId.trim()) throw new BadRequestException('referenceId is required');
    if (amount.lte(0)) throw new BadRequestException('Amount must be greater than zero');

    return this.prisma.$transaction(async (tx) => {
      const concurrencyKey = input.concurrencyKey?.trim();
      if (concurrencyKey) {
        await tx.$queryRaw<Array<{ locked: boolean }>>`
          SELECT pg_advisory_xact_lock(hashtextextended(${concurrencyKey}, 0)) IS NULL AS "locked"
        `;
      }

      const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
      if (existing) {
        const existingPayloadHash = this.metadataString(existing.metadata, 'payloadHash');
        const requestedPayloadHash = this.metadataString(input.metadata, 'payloadHash');
        const payloadMatches = !existingPayloadHash && !requestedPayloadHash ? true : Boolean(existingPayloadHash && requestedPayloadHash && existingPayloadHash === requestedPayloadHash);
        const sameRequest = existing.userId === userId && existing.direction === input.direction && existing.amount.equals(amount) && existing.referenceType === input.referenceType && existing.referenceId === input.referenceId && payloadMatches;
        if (!sameRequest) throw new ConflictException('Idempotency key was already used with different game transaction data');
        return { wallet: await this.currentWalletInTransaction(tx, userId), ledger: this.formatLedger(existing), replayed: true };
      }

      if (input.beforeMutation) await input.beforeMutation(tx);
      const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!user) throw new NotFoundException('User not found');

      const wallet = await tx.wallet.upsert({ where: { userId }, update: {}, create: { userId, currency: input.currency || 'THB' } });
      if (wallet.status !== 'ACTIVE') throw new BadRequestException('Wallet is not active');
      if (input.currency && wallet.currency !== input.currency) throw new BadRequestException('Wallet currency does not match game transaction currency');

      const balanceBefore = wallet.balance;
      const balanceAfter = input.direction === 'CREDIT' ? balanceBefore.plus(amount) : balanceBefore.minus(amount);
      if (balanceAfter.lt(0)) throw new BadRequestException('Insufficient wallet balance');
      if (input.direction === 'DEBIT' && balanceAfter.lt(wallet.lockedBalance)) throw new BadRequestException('Insufficient available wallet balance');

      const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
      const ledger = await tx.walletLedger.create({ data: { walletId: wallet.id, userId, type: input.isReversal ? 'REVERSAL' : 'TRANSFER', direction: input.direction, amount, balanceBefore, balanceAfter, referenceType: input.referenceType, referenceId: input.referenceId, idempotencyKey, metadata: input.metadata ?? Prisma.JsonNull } });
      return { wallet: this.formatWallet(updatedWallet), ledger: this.formatLedger(ledger), replayed: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async ensureWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.wallet.create({ data: { userId, currency: 'THB' } });
  }

  private async currentWalletInTransaction(tx: Prisma.TransactionClient, userId: string) {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return this.formatWallet(wallet);
  }

  private metadataString(metadata: unknown, key: string) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private deriveGameOperation(ledger: any) {
    const explicit = this.metadataString(ledger.metadata, 'gameOperation');
    if (explicit) return explicit.toUpperCase();
    const referenceType = String(ledger.referenceType ?? '').toLowerCase();
    const legacyMap: Record<string, string> = {
      game_bet: 'BET', game_win: 'WIN', game_refund: 'REFUND', game_rollback_bet: 'ROLLBACK_BET', game_rollback_win: 'ROLLBACK_WIN',
      game_transfer_in: 'TRANSFER_IN', game_transfer_out: 'TRANSFER_OUT',
    };
    if (legacyMap[referenceType]) return legacyMap[referenceType];
    if (referenceType.startsWith('game_')) return referenceType.slice(5).toUpperCase();
    return null;
  }

  private matchesLedgerFilters(item: any, query: LedgerSemanticFilters) {
    const operation = query.operation?.trim().toUpperCase();
    const provider = query.provider?.trim().toLowerCase();
    const gameCode = query.gameCode?.trim().toLowerCase();
    const roundId = query.roundId?.trim().toLowerCase();
    if (operation && item.gameOperation !== operation) return false;
    if (provider && String(item.provider ?? '').toLowerCase() !== provider) return false;
    if (gameCode && String(item.gameCode ?? '').toLowerCase() !== gameCode) return false;
    if (roundId && String(item.roundId ?? '').toLowerCase() !== roundId) return false;
    return true;
  }

  private filterFormattedLedgers(items: any[], query: LedgerSemanticFilters) { return items.filter((item) => this.matchesLedgerFilters(item, query)); }
  private normalizeLedgerFilters(query: LedgerSemanticFilters) { return { operation: query.operation?.trim().toUpperCase() || null, provider: query.provider?.trim() || null, gameCode: query.gameCode?.trim() || null, roundId: query.roundId?.trim() || null }; }
  private matchesIdentifier(identifier: string, user: any, userId: string) { const q = identifier.toLowerCase(); return userId.toLowerCase() === q || userId.toLowerCase().startsWith(q) || user?.username?.toLowerCase().includes(q) || user?.phone?.toLowerCase().includes(q) || user?.email?.toLowerCase().includes(q); }
  private shortId(id?: string | null) { return id ? id.slice(0, 8) : null; }
  private formatAdminLedger(item: any) { return { ...this.formatLedger(item), shortUserId: this.shortId(item.userId), user: item.user ? { ...item.user, shortId: this.shortId(item.user.id) } : null, wallet: item.wallet ? this.formatWallet(item.wallet) : null, createdByAdmin: item.createdByAdmin }; }
  private formatWallet(wallet: any) { return { id: wallet.id, userId: wallet.userId, shortUserId: this.shortId(wallet.userId), currency: wallet.currency, balance: wallet.balance.toString(), lockedBalance: wallet.lockedBalance.toString(), availableBalance: wallet.balance.minus(wallet.lockedBalance).toString(), status: wallet.status, updatedAt: wallet.updatedAt }; }
  private formatLedger(ledger: any) {
    const gameOperation = this.deriveGameOperation(ledger);
    return { id: ledger.id, walletId: ledger.walletId, userId: ledger.userId, shortUserId: this.shortId(ledger.userId), type: ledger.type, direction: ledger.direction, amount: ledger.amount.toString(), balanceBefore: ledger.balanceBefore.toString(), balanceAfter: ledger.balanceAfter.toString(), referenceType: ledger.referenceType, referenceId: ledger.referenceId, metadata: ledger.metadata, gameOperation, provider: this.metadataString(ledger.metadata, 'provider'), gameCode: this.metadataString(ledger.metadata, 'gameCode'), roundId: this.metadataString(ledger.metadata, 'roundId'), originalTransactionId: this.metadataString(ledger.metadata, 'originalTransactionId'), createdByAdminId: ledger.createdByAdminId, createdAt: ledger.createdAt };
  }
}

type LedgerSemanticFilters = { operation?: string; provider?: string; gameCode?: string; roundId?: string };
type MemberLedgerQuery = LedgerSemanticFilters;
type AdminLedgerQuery = LedgerSemanticFilters & { userId?: string; identifier?: string; type?: string; direction?: string; limit?: string; page?: string; take?: string };
type AdminWalletQuery = { search?: string; limit?: string; page?: string; take?: string };
type RequestMeta = { ipAddress?: string; userAgent?: string };
export type GameWalletMutationInput = { userId: string; amount: string | number | Decimal; direction: 'CREDIT' | 'DEBIT'; idempotencyKey: string; referenceType: string; referenceId: string; currency?: string; isReversal?: boolean; metadata?: Prisma.InputJsonValue; concurrencyKey?: string; beforeMutation?: (tx: Prisma.TransactionClient) => Promise<void> };
