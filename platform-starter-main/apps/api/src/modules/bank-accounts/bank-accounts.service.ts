import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type BankBody = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  promptPay?: string;
  qrImageUrl?: string;
  minAmount?: number | string | null;
  maxAmount?: number | string | null;
  status?: 'ACTIVE' | 'DISABLED' | 'PENDING_REVIEW' | 'REJECTED';
  sortOrder?: number;
  adminNote?: string;
};
type PaymentType = 'bank_transfer' | 'promptpay' | 'wallet' | 'other';

@Injectable()
export class BankAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveReceivingAccounts() {
    const items = await this.prisma.receivingBankAccount.findMany({ where: { status: 'ACTIVE' }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return { items: items.map(this.mapReceiving) };
  }

  async assignReceivingAccount(paymentType = 'bank_transfer', amount?: string | number) {
    const parsedAmount = amount === undefined || amount === '' ? null : Number(amount);
    if (parsedAmount !== null && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) throw new BadRequestException('Invalid amount');
    const all = await this.prisma.receivingBankAccount.findMany({ where: { status: 'ACTIVE' }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    const items = all.filter((item) => this.paymentType(item.bankName) === paymentType && this.matchAmount(item, parsedAmount));
    if (items.length === 0) throw new NotFoundException('No active receiving account for this payment method');
    const index = Math.floor(Date.now() / 60000) % items.length;
    return { item: this.mapReceiving(items[index]) };
  }

  async listReceivingAccounts() {
    const items = await this.prisma.receivingBankAccount.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
    return { items: items.map(this.mapReceiving) };
  }

  async createReceivingAccount(body: BankBody, admin: any, meta: any) {
    this.requireBankFields(body);
    const item = await this.prisma.receivingBankAccount.create({
      data: { bankName: body.bankName!.trim(), accountName: body.accountName!.trim(), accountNumber: body.accountNumber!.trim(), promptPay: body.promptPay?.trim() || null, qrImageUrl: body.qrImageUrl?.trim() || null, minAmount: this.decimalOrNull(body.minAmount), maxAmount: this.decimalOrNull(body.maxAmount), status: body.status ?? 'ACTIVE', sortOrder: Number(body.sortOrder ?? 100) },
    });
    await this.audit(admin?.id, 'CREATE_RECEIVING_BANK_ACCOUNT', item.id, null, this.mapReceiving(item), meta);
    return { item: this.mapReceiving(item) };
  }

  async updateReceivingAccount(id: string, body: BankBody, admin: any, meta: any) {
    const existing = await this.prisma.receivingBankAccount.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Receiving bank account not found');
    const item = await this.prisma.receivingBankAccount.update({ where: { id }, data: { bankName: body.bankName?.trim() ?? undefined, accountName: body.accountName?.trim() ?? undefined, accountNumber: body.accountNumber?.trim() ?? undefined, promptPay: body.promptPay === undefined ? undefined : body.promptPay?.trim() || null, qrImageUrl: body.qrImageUrl === undefined ? undefined : body.qrImageUrl?.trim() || null, minAmount: body.minAmount === undefined ? undefined : this.decimalOrNull(body.minAmount), maxAmount: body.maxAmount === undefined ? undefined : this.decimalOrNull(body.maxAmount), status: body.status ?? undefined, sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder) } });
    await this.audit(admin?.id, 'UPDATE_RECEIVING_BANK_ACCOUNT', id, this.mapReceiving(existing), this.mapReceiving(item), meta);
    return { item: this.mapReceiving(item) };
  }

  async listMemberBankAccounts(userId: string) {
    const items = await this.prisma.memberBankAccount.findMany({ where: { userId }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }] });
    return { items: items.map(this.mapMemberBank) };
  }

  async createMemberBankAccount(userId: string, body: BankBody) {
    this.requireBankFields(body);
    const existing = await this.prisma.memberBankAccount.findFirst({ where: { userId } });
    if (existing) throw new BadRequestException('สมาชิก 1 คนเพิ่มบัญชีถอนได้ 1 บัญชีเท่านั้น');
    const duplicateActive = await this.prisma.memberBankAccount.findFirst({ where: { accountNumber: body.accountNumber!.trim(), status: { in: ['ACTIVE', 'PENDING_REVIEW'] } } });
    if (duplicateActive) throw new BadRequestException('เลขบัญชีนี้ถูกใช้ในระบบแล้ว');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) throw new NotFoundException('Member not found');
    const allowedNames = [user.profile?.displayName, user.username].filter(Boolean).map((value) => this.normalizeName(String(value)));
    const submittedName = this.normalizeName(body.accountName!);
    if (!allowedNames.includes(submittedName)) throw new BadRequestException('ชื่อบัญชีต้องตรงกับชื่อบัญชีสมาชิก');
    const item = await this.prisma.memberBankAccount.create({ data: { userId, bankName: body.bankName!.trim(), accountName: body.accountName!.trim(), accountNumber: body.accountNumber!.trim(), isPrimary: true, status: 'PENDING_REVIEW' } });
    return { item: this.mapMemberBank(item) };
  }

  async setPrimaryMemberBankAccount(userId: string, id: string) {
    const existing = await this.prisma.memberBankAccount.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Member bank account not found');
    await this.prisma.$transaction([this.prisma.memberBankAccount.updateMany({ where: { userId }, data: { isPrimary: false } }), this.prisma.memberBankAccount.update({ where: { id }, data: { isPrimary: true } })]);
    const item = await this.prisma.memberBankAccount.findUniqueOrThrow({ where: { id } });
    return { item: this.mapMemberBank(item) };
  }

  async listAllMemberBankAccounts(search?: string) {
    const where = search?.trim() ? { OR: [{ bankName: { contains: search.trim(), mode: 'insensitive' as const } }, { accountName: { contains: search.trim(), mode: 'insensitive' as const } }, { accountNumber: { contains: search.trim(), mode: 'insensitive' as const } }, { user: { username: { contains: search.trim(), mode: 'insensitive' as const } } }] } : {};
    const items = await this.prisma.memberBankAccount.findMany({ where, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 200, include: { user: { select: { id: true, username: true, phone: true, email: true, status: true } } } });
    return { items: items.map((item) => ({ ...this.mapMemberBank(item), user: item.user })) };
  }

  async kycSummary() {
    const [pending, active, rejected, disabled, accounts, unverifiedPhones] = await Promise.all([
      this.prisma.memberBankAccount.count({ where: { status: 'PENDING_REVIEW' } }),
      this.prisma.memberBankAccount.count({ where: { status: 'ACTIVE' } }),
      this.prisma.memberBankAccount.count({ where: { status: 'REJECTED' } }),
      this.prisma.memberBankAccount.count({ where: { status: 'DISABLED' } }),
      this.prisma.memberBankAccount.findMany({ take: 500, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, username: true, phone: true, email: true, status: true, phoneVerifiedAt: true } } } }),
      this.prisma.user.count({ where: { phone: { not: null }, phoneVerifiedAt: null } }),
    ]);
    const groups = new Map<string, any[]>();
    for (const item of accounts) {
      const key = item.accountNumber.replace(/\D/g, '') || item.accountNumber;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    const duplicateGroups = Array.from(groups.entries()).filter(([, rows]) => rows.length > 1).map(([accountNumber, rows]) => ({ accountNumber, count: rows.length, items: rows.map((row) => ({ ...this.mapMemberBank(row), user: row.user })) }));
    const riskyAccounts = accounts.filter((item) => item.status === 'PENDING_REVIEW' || item.user?.status !== 'ACTIVE' || item.user?.phoneVerifiedAt === null).slice(0, 50).map((item) => ({ ...this.mapMemberBank(item), user: item.user, flags: this.bankFlags(item, duplicateGroups) }));
    return { summary: { pending, active, rejected, disabled, duplicateGroups: duplicateGroups.length, unverifiedPhones }, duplicateGroups, riskyAccounts };
  }

  async reviewMemberBankAccount(id: string, body: BankBody, admin: any, meta: any) {
    const existing = await this.prisma.memberBankAccount.findUnique({ where: { id }, include: { user: { select: { id: true, username: true, status: true } } } });
    if (!existing) throw new NotFoundException('Member bank account not found');
    if (body.status === 'ACTIVE') {
      const duplicate = await this.prisma.memberBankAccount.findFirst({ where: { id: { not: id }, accountNumber: existing.accountNumber, status: { in: ['ACTIVE', 'PENDING_REVIEW'] } } });
      if (duplicate) throw new BadRequestException('เลขบัญชีนี้ซ้ำกับสมาชิกอื่น ต้องตรวจสอบก่อนอนุมัติ');
      if (existing.user?.status !== 'ACTIVE') throw new BadRequestException('สมาชิกไม่ได้อยู่สถานะ ACTIVE ไม่ควรอนุมัติบัญชี');
    }
    const item = await this.prisma.memberBankAccount.update({ where: { id }, data: { status: body.status ?? 'ACTIVE', adminNote: body.adminNote ?? undefined } });
    await this.audit(admin?.id, 'REVIEW_MEMBER_BANK_ACCOUNT', id, this.mapMemberBank(existing), this.mapMemberBank(item), meta);
    return { item: this.mapMemberBank(item) };
  }

  private bankFlags(item: any, duplicateGroups: Array<{ accountNumber: string }>) {
    const flags = [];
    const normalized = item.accountNumber.replace(/\D/g, '') || item.accountNumber;
    if (item.status === 'PENDING_REVIEW') flags.push('รอตรวจบัญชี');
    if (duplicateGroups.some((group) => group.accountNumber === normalized)) flags.push('เลขบัญชีซ้ำ');
    if (item.user?.status && item.user.status !== 'ACTIVE') flags.push('สมาชิกไม่ปกติ');
    if (item.user?.phone && !item.user?.phoneVerifiedAt) flags.push('ยังไม่ยืนยันเบอร์');
    return flags;
  }
  private requireBankFields(body: BankBody) { if (!body.bankName?.trim() || !body.accountName?.trim() || !body.accountNumber?.trim()) throw new BadRequestException('bankName, accountName and accountNumber are required'); }
  private decimalOrNull(value: unknown) { if (value === null || value === undefined || value === '') return null; const next = Number(value); if (!Number.isFinite(next) || next < 0) throw new BadRequestException('Invalid amount limit'); return next; }
  private normalizeName(value: string) { return value.replace(/\s+/g, '').trim().toLowerCase(); }
  private paymentType(bankName: string): PaymentType { if (bankName === 'พร้อมเพย์') return 'promptpay'; if (bankName === 'วอเลต') return 'wallet'; if (bankName === 'อื่น ๆ') return 'other'; return 'bank_transfer'; }
  private matchAmount(item: any, amount: number | null) { if (amount === null) return true; const min = item.minAmount ? Number(item.minAmount) : 0; const max = item.maxAmount ? Number(item.maxAmount) : Infinity; return amount >= min && amount <= max; }
  private mapReceiving(item: any) { return { id: item.id, bankName: item.bankName, accountName: item.accountName, accountNumber: item.accountNumber, promptPay: item.promptPay, qrImageUrl: item.qrImageUrl, minAmount: item.minAmount?.toString?.() ?? null, maxAmount: item.maxAmount?.toString?.() ?? null, status: item.status, sortOrder: item.sortOrder, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private mapMemberBank(item: any) { return { id: item.id, userId: item.userId, bankName: item.bankName, accountName: item.accountName, accountNumber: item.accountNumber, isPrimary: item.isPrimary, status: item.status, adminNote: item.adminNote, createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private audit(adminUserId: string | undefined, action: string, targetId: string, oldData: any, newData: any, meta: any) { return this.prisma.adminAuditLog.create({ data: { adminUserId, module: 'bank_accounts', action, targetId, oldData, newData, ipAddress: meta?.ipAddress, userAgent: meta?.userAgent } }); }
}
