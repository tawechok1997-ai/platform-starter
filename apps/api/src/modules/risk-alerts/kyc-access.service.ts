import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

type KycAccessPayload = { documentId: string; adminId: string; expiresAt: number };

@Injectable()
export class KycAccessService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  issueAccessToken(documentId: string, adminId: string) {
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const payload = Buffer.from(JSON.stringify({ documentId, adminId, expiresAt } satisfies KycAccessPayload)).toString('base64url');
    return { token: `${payload}.${this.sign(payload)}`, expiresAt: new Date(expiresAt * 1000) };
  }

  async downloadWithToken(token: string, adminId: string) {
    const decoded = this.verifyToken(token, adminId);
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT * FROM "kyc_documents" WHERE "id"=${decoded.documentId}::uuid AND "deleted_at" IS NULL
    `);
    const row = rows[0];
    if (!row) throw new NotFoundException('KYC document not found');

    const stored = await this.storage.get(String(row.storage_key), String(row.mime_type));
    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: adminId,
        module: 'kyc',
        action: 'DOWNLOAD_KYC_DOCUMENT',
        targetId: decoded.documentId,
        newData: { access: 'token', expiresAt: decoded.expiresAt },
      }),
    });
    return {
      dataUrl: `data:${stored.contentType};base64,${stored.data.toString('base64')}`,
      fileName: String(row.original_name),
      mimeType: stored.contentType,
    };
  }

  verifyToken(token: string, adminId: string): KycAccessPayload {
    const [payload, signature] = String(token ?? '').split('.');
    if (!payload || !signature || !this.safeEqual(signature, this.sign(payload))) {
      throw new ForbiddenException('Invalid KYC access token');
    }
    let decoded: KycAccessPayload;
    try {
      decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as KycAccessPayload;
    } catch {
      throw new ForbiddenException('Invalid KYC access token');
    }
    if (decoded.adminId !== adminId || decoded.expiresAt < Math.floor(Date.now() / 1000)) {
      throw new ForbiddenException('Expired or unauthorized KYC access token');
    }
    return decoded;
  }

  private sign(payload: string) {
    const secret = process.env.KYC_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 16) throw new BadRequestException('KYC access secret is not configured');
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }

  private safeEqual(left: string, right: string) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
