import type { AdminActor } from '../../common/actors';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';


@Injectable()
export class GameTransferActionService {
  constructor(private readonly prisma: PrismaService) {}
  async manualReverse(id: string, actor: AdminActor, note?: string) {
    const adminNote = this.requireNote(note);
    const transfer = await this.prisma.gameTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Game transfer not found');
    if (transfer.status !== 'SUCCESS') throw new BadRequestException('Only SUCCESS transfers can be manually reversed');
    const amount = Number(transfer.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Invalid transfer amount');
    const direction = transfer.type === 'TRANSFER_IN' ? 'CREDIT' : 'DEBIT';
    const idempotencyKey = `manual_reverse_${transfer.id}`;
    const result = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.walletLedger.findUnique({ where: { idempotencyKey } });
      if (existing) throw new BadRequestException('Transfer has already been manually reversed');
      const wallet = await tx.wallet.findUnique({ where: { userId: transfer.userId } });
      if (!wallet) throw new BadRequestException('Wallet not found');
      const before = Number(wallet.balance);
      const after = direction === 'CREDIT' ? before + amount : before - amount;
      if (after < 0) throw new BadRequestException('Wallet balance is not enough to reverse this transfer safely');
      const now = new Date();
      const updatedWallet = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: after.toFixed(2) } });
      const ledger = await tx.walletLedger.create({ data: { walletId: wallet.id, userId: transfer.userId, type: 'REVERSAL', direction, amount: amount.toFixed(2), balanceBefore: before.toFixed(2), balanceAfter: after.toFixed(2), referenceType: 'GAME_TRANSFER_MANUAL_REVERSE', referenceId: transfer.id, idempotencyKey, metadata: { transferId: transfer.id, providerId: transfer.providerId, note: adminNote, reversedBy: actor.id, reversedAt: now.toISOString() } } });
      const payload = this.mergeJson(transfer.responsePayload, { manualReverse: { note: adminNote, reversedBy: actor.id, reversedAt: now.toISOString(), ledgerId: ledger.id, direction, balanceAfter: updatedWallet.balance, previousStatus: transfer.status } });
      const updatedTransfer = await tx.gameTransfer.update({ where: { id: transfer.id }, data: { status: 'REVERSED', adminNote, responsePayload: payload, resolvedAt: now }, include: { user: { select: { id: true, username: true, phone: true } }, provider: { select: { id: true, name: true, code: true } }, session: { select: { id: true, providerSessionId: true, game: { select: { id: true, name: true, providerGameCode: true } } } } } });
      await tx.adminAuditLog.create({ data: { adminUserId: actor.id, action: 'game.transfer.manual_reverse', module: 'game-platform', targetId: transfer.id, newData: this.safeJson({ note: adminNote, ledgerId: ledger.id, direction, previousStatus: transfer.status, nextStatus: 'REVERSED', balanceAfter: updatedWallet.balance }) } });
      return { transfer: updatedTransfer, ledger, wallet: updatedWallet };
    });
    return { ok: true, ...result };
  }
  async forceFail(id: string, actor: AdminActor, note?: string) {
    const adminNote = this.requireNote(note);
    const transfer = await this.prisma.gameTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException('Game transfer not found');
    if (transfer.status !== 'PENDING') throw new BadRequestException('Only PENDING transfers can be force failed');
    const now = new Date();
    const payload = this.mergeJson(transfer.responsePayload, { forceFail: { note: adminNote, failedBy: actor.id, failedAt: now.toISOString(), previousStatus: transfer.status } });
    const changed = await this.prisma.gameTransfer.updateMany({ where: { id, status: 'PENDING' }, data: { status: 'FAILED', adminNote, errorCode: transfer.errorCode ?? 'FORCE_FAILED', errorMessage: adminNote, responsePayload: payload, resolvedAt: now } });
    if (changed.count !== 1) throw new BadRequestException('Transfer is no longer PENDING');
    const item = await this.prisma.gameTransfer.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, phone: true } }, provider: { select: { id: true, name: true, code: true } }, session: { select: { id: true, providerSessionId: true, game: { select: { id: true, name: true, providerGameCode: true } } } } } });
    await this.prisma.adminAuditLog.create({ data: { adminUserId: actor.id, action: 'game.transfer.force_fail', module: 'game-platform', targetId: id, newData: this.safeJson({ note: adminNote, previousStatus: transfer.status, nextStatus: 'FAILED' }) } });
    return { ok: true, transfer: item };
  }
  private requireNote(note?: string) { const value = note?.trim(); if (!value) throw new BadRequestException('Admin note is required'); return value; }
  private objectJson(value: unknown) { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
  private mergeJson(current: unknown, patch: Record<string, unknown>) { return this.safeJson({ ...this.objectJson(current), ...patch }); }
  private safeJson(value: unknown) { return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue; }
}
