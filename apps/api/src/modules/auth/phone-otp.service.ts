import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { SmsProviderService } from './sms-provider.service';

export type PhoneOtpRequestMeta = { ipAddress?: string; deviceId?: string };

type ChallengeRow = {
  id: string;
  user_id: string;
  phone_hash: string;
  otp_hash: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  expires_at: Date;
  used_at: Date | null;
  revoked_at: Date | null;
};

type VerifyOutcome =
  | { kind: 'verified' }
  | { kind: 'replay' }
  | { kind: 'missing' }
  | { kind: 'expired' }
  | { kind: 'locked' }
  | { kind: 'invalid' }
  | { kind: 'phone_changed' }
  | { kind: 'raced' };

@Injectable()
export class PhoneOtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsProviderService,
  ) {}

  async request(userId: string, meta: PhoneOtpRequestMeta = {}) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, phone: true, phoneVerifiedAt: true } });
    if (!user) throw new BadRequestException('Member not found');
    if (!user.phone) throw new BadRequestException('กรุณาเพิ่มเบอร์โทรก่อนขอ OTP');
    if (user.phoneVerifiedAt) return { success: true, alreadyVerified: true };

    const phone = this.normalizePhone(user.phone);
    const phoneHash = this.hash(`phone:${phone}`);
    const ipHash = meta.ipAddress ? this.hash(`ip:${meta.ipAddress.trim().toLowerCase()}`) : null;
    const deviceHash = meta.deviceId ? this.hash(`device:${meta.deviceId.trim()}`) : null;
    await this.enforceRateLimits(phoneHash, ipHash, deviceHash);

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const otpHash = this.hash(`otp:${code}`);
    const ttlMinutes = this.intEnv('PHONE_OTP_TTL_MINUTES', 5, 1, 15);
    const maxAttempts = this.intEnv('PHONE_OTP_MAX_ATTEMPTS', 5, 1, 10);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const providerName = String(process.env.SMS_PROVIDER ?? 'console').toLowerCase();

    const challenge = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE "phone_otp_challenges"
        SET "status" = 'REVOKED', "revoked_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
        WHERE "user_id" = ${userId}::uuid AND "purpose" = 'PHONE_VERIFY' AND "status" = 'ACTIVE'
      `);
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        INSERT INTO "phone_otp_challenges" (
          "user_id", "phone_hash", "phone_masked", "otp_hash", "max_attempts",
          "ip_hash", "device_hash", "provider", "expires_at"
        ) VALUES (
          ${userId}::uuid, ${phoneHash}, ${this.mask(phone)}, ${otpHash}, ${maxAttempts},
          ${ipHash}, ${deviceHash}, ${providerName}, ${expiresAt}
        ) RETURNING "id"
      `);
      return rows[0];
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    let delivery;
    try {
      delivery = await this.sms.sendOtp(phone, code, ttlMinutes);
    } catch (error) {
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "phone_otp_challenges"
        SET "status" = 'REVOKED', "revoked_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${challenge.id}::uuid AND "status" = 'ACTIVE'
      `);
      throw error;
    }

    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "phone_otp_challenges"
      SET "provider" = ${delivery.provider}, "provider_message_id" = ${delivery.messageId ?? null}, "updated_at" = CURRENT_TIMESTAMP
      WHERE "id" = ${challenge.id}::uuid
    `);

    const response: Record<string, unknown> = { success: true, expiresInSeconds: ttlMinutes * 60, phoneMasked: this.mask(phone) };
    if (process.env.PHONE_OTP_EXPOSE_CODE === 'true' && process.env.NODE_ENV !== 'production') response.code = code;
    return response;
  }

  async verify(userId: string, codeInput: string) {
    const code = String(codeInput ?? '').trim();
    if (!/^\d{6}$/.test(code)) throw new BadRequestException('OTP ต้องเป็นตัวเลข 6 หลัก');

    const outcome = await this.prisma.$transaction<VerifyOutcome>(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { phone: true, phoneVerifiedAt: true } });
      if (!user?.phone) return { kind: 'missing' };
      if (user.phoneVerifiedAt) return { kind: 'replay' };

      const rows = await tx.$queryRaw<ChallengeRow[]>(Prisma.sql`
        SELECT * FROM "phone_otp_challenges"
        WHERE "user_id" = ${userId}::uuid AND "purpose" = 'PHONE_VERIFY'
        ORDER BY "created_at" DESC
        LIMIT 1
        FOR UPDATE
      `);
      const challenge = rows[0];
      if (!challenge || challenge.status !== 'ACTIVE' || challenge.used_at || challenge.revoked_at) return { kind: 'replay' };
      if (new Date(challenge.expires_at).getTime() <= Date.now()) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "phone_otp_challenges" SET "status" = 'EXPIRED', "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = ${challenge.id}::uuid AND "status" = 'ACTIVE'
        `);
        return { kind: 'expired' };
      }
      if (challenge.attempt_count >= challenge.max_attempts) return { kind: 'locked' };

      const currentPhoneHash = this.hash(`phone:${this.normalizePhone(user.phone)}`);
      if (!this.safeEqual(currentPhoneHash, challenge.phone_hash)) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE "phone_otp_challenges" SET "status" = 'REVOKED', "revoked_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = ${challenge.id}::uuid
        `);
        return { kind: 'phone_changed' };
      }

      const valid = this.safeEqual(this.hash(`otp:${code}`), challenge.otp_hash);
      if (!valid) {
        const nextAttempts = challenge.attempt_count + 1;
        await tx.$executeRaw(Prisma.sql`
          UPDATE "phone_otp_challenges"
          SET "attempt_count" = ${nextAttempts},
              "status" = CASE WHEN ${nextAttempts} >= "max_attempts" THEN 'LOCKED' ELSE 'ACTIVE' END,
              "updated_at" = CURRENT_TIMESTAMP
          WHERE "id" = ${challenge.id}::uuid AND "status" = 'ACTIVE'
        `);
        return { kind: nextAttempts >= challenge.max_attempts ? 'locked' : 'invalid' };
      }

      const consumed = await tx.$executeRaw(Prisma.sql`
        UPDATE "phone_otp_challenges"
        SET "status" = 'VERIFIED', "used_at" = CURRENT_TIMESTAMP, "updated_at" = CURRENT_TIMESTAMP
        WHERE "id" = ${challenge.id}::uuid AND "status" = 'ACTIVE' AND "used_at" IS NULL
      `);
      if (consumed !== 1) return { kind: 'raced' };
      await tx.user.update({ where: { id: userId }, data: { phoneVerifiedAt: new Date() } });
      return { kind: 'verified' };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (outcome.kind === 'verified') return { success: true, phoneVerified: true };
    if (outcome.kind === 'expired') throw new BadRequestException('OTP หมดอายุแล้ว');
    if (outcome.kind === 'locked') throw this.tooManyRequests('OTP ถูกล็อกเนื่องจากลองผิดเกินกำหนด');
    if (outcome.kind === 'invalid') throw new BadRequestException('OTP ไม่ถูกต้อง');
    if (outcome.kind === 'phone_changed') throw new ConflictException('เบอร์โทรมีการเปลี่ยนแปลง กรุณาขอ OTP ใหม่');
    if (outcome.kind === 'raced') throw new ConflictException('OTP ถูกใช้โดยคำขออื่นแล้ว');
    if (outcome.kind === 'missing') throw new BadRequestException('Member phone not found');
    throw new BadRequestException('OTP ไม่ถูกต้องหรือถูกใช้แล้ว');
  }

  private async enforceRateLimits(phoneHash: string, ipHash: string | null, deviceHash: string | null) {
    const since = new Date(Date.now() - 10 * 60_000);
    const phoneLimit = this.intEnv('PHONE_OTP_PHONE_LIMIT_10M', 3, 1, 20);
    const ipLimit = this.intEnv('PHONE_OTP_IP_LIMIT_10M', 10, 1, 100);
    const deviceLimit = this.intEnv('PHONE_OTP_DEVICE_LIMIT_10M', 5, 1, 50);
    const rows = await this.prisma.$queryRaw<Array<{ phone_count: bigint; ip_count: bigint; device_count: bigint }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "phone_hash" = ${phoneHash})::bigint AS phone_count,
        COUNT(*) FILTER (WHERE ${ipHash}::text IS NOT NULL AND "ip_hash" = ${ipHash})::bigint AS ip_count,
        COUNT(*) FILTER (WHERE ${deviceHash}::text IS NOT NULL AND "device_hash" = ${deviceHash})::bigint AS device_count
      FROM "phone_otp_challenges"
      WHERE "created_at" >= ${since}
    `);
    const counts = rows[0] ?? { phone_count: 0n, ip_count: 0n, device_count: 0n };
    if (Number(counts.phone_count) >= phoneLimit) throw this.tooManyRequests('ขอ OTP สำหรับเบอร์นี้ถี่เกินไป');
    if (ipHash && Number(counts.ip_count) >= ipLimit) throw this.tooManyRequests('ขอ OTP จาก IP นี้ถี่เกินไป');
    if (deviceHash && Number(counts.device_count) >= deviceLimit) throw this.tooManyRequests('ขอ OTP จากอุปกรณ์นี้ถี่เกินไป');
  }

  private tooManyRequests(message: string) {
    return new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }

  private normalizePhone(value: string) {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) throw new BadRequestException('Invalid phone number');
    return digits;
  }

  private mask(phone: string) {
    return `${'*'.repeat(Math.max(phone.length - 4, 4))}${phone.slice(-4)}`;
  }

  private hash(value: string) {
    const secret = process.env.PHONE_OTP_SECRET || process.env.RISK_MATCH_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 16) throw new BadRequestException('Phone OTP secret is not configured');
    return createHmac('sha256', secret).update(value).digest('hex');
  }

  private safeEqual(left: string, right: string) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private intEnv(name: string, fallback: number, min: number, max: number) {
    const value = Number(process.env[name] ?? fallback);
    return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  }
}
