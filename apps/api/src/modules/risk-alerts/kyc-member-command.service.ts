import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { UploadKycDocumentDto } from './dto/kyc-document.dto';
import { mapKycCase, mapKycDocument, type KycRow } from './kyc.mapper';

const MAX_BYTES = 10 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class KycMemberCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(memberId: string, input: UploadKycDocumentDto) {
    const parsed = this.parseDataUrl(input.dataUrl);
    const sha256 = createHash('sha256').update(parsed.data).digest('hex');
    const caseRow = await this.getOrCreateDraftCase(memberId);
    if (caseRow.status !== 'DRAFT') throw new ConflictException('KYC case is not accepting documents');

    const key = `kyc/${memberId}/${String(caseRow.id)}/${randomUUID()}.${MIME_TO_EXT[parsed.mimeType]}`;
    const retentionDays = Math.min(Math.max(Number(process.env.KYC_RETENTION_DAYS ?? 365), 30), 3650);
    const retentionUntil = new Date(Date.now() + retentionDays * 86_400_000);
    await this.storage.put(key, parsed.data, parsed.mimeType);

    try {
      const rows = await this.prisma.$queryRaw<KycRow[]>(Prisma.sql`
        INSERT INTO "kyc_documents" (
          "case_id","member_id","document_type","storage_key","original_name","mime_type",
          "size_bytes","sha256","retention_until"
        ) VALUES (
          ${String(caseRow.id)}::uuid, ${memberId}::uuid, ${input.documentType}, ${key},
          ${this.safeFileName(input.originalName)}, ${parsed.mimeType}, ${parsed.data.length}, ${sha256}, ${retentionUntil}
        ) RETURNING *
      `);
      return { item: mapKycDocument(rows[0]) };
    } catch (error: unknown) {
      await this.storage.remove(key).catch(() => undefined);
      if (this.databaseErrorCode(error) === '23505') {
        throw new ConflictException('A current document of this type already exists');
      }
      throw error;
    }
  }

  async submit(memberId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cases = await tx.$queryRaw<KycRow[]>(Prisma.sql`
        SELECT * FROM "kyc_cases" WHERE "member_id" = ${memberId}::uuid AND "status" = 'DRAFT' FOR UPDATE
      `);
      const row = cases[0];
      if (!row) throw new NotFoundException('Draft KYC case not found');

      const docs = await tx.$queryRaw<Array<{ document_type: string }>>(Prisma.sql`
        SELECT "document_type" FROM "kyc_documents"
        WHERE "case_id" = ${String(row.id)}::uuid AND "deleted_at" IS NULL AND "status" = 'UPLOADED'
      `);
      const types = new Set(docs.map((doc) => doc.document_type));
      const hasIdentity = types.has('PASSPORT') || (types.has('NATIONAL_ID_FRONT') && types.has('NATIONAL_ID_BACK'));
      if (!hasIdentity || !types.has('SELFIE')) {
        throw new BadRequestException('Identity document and selfie are required');
      }

      const updated = await tx.$queryRaw<KycRow[]>(Prisma.sql`
        UPDATE "kyc_cases" SET "status"='SUBMITTED', "submitted_at"=CURRENT_TIMESTAMP,
          "version"="version"+1, "updated_at"=CURRENT_TIMESTAMP
        WHERE "id"=${String(row.id)}::uuid AND "version"=${Number(row.version ?? 1)}
        RETURNING *
      `);
      if (!updated[0]) throw new ConflictException('KYC case changed during submission');
      return { item: mapKycCase(updated[0]) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private async getOrCreateDraftCase(memberId: string): Promise<KycRow> {
    const current = await this.prisma.$queryRaw<KycRow[]>(Prisma.sql`
      SELECT * FROM "kyc_cases" WHERE "member_id"=${memberId}::uuid AND "status" IN ('DRAFT','SUBMITTED','REVIEWING')
      ORDER BY "created_at" DESC LIMIT 1
    `);
    if (current[0]) return current[0];

    try {
      const rows = await this.prisma.$queryRaw<KycRow[]>(Prisma.sql`
        INSERT INTO "kyc_cases" ("member_id") VALUES (${memberId}::uuid) RETURNING *
      `);
      return rows[0];
    } catch (error: unknown) {
      if (this.databaseErrorCode(error) !== '23505') throw error;
      const rows = await this.prisma.$queryRaw<KycRow[]>(Prisma.sql`
        SELECT * FROM "kyc_cases" WHERE "member_id"=${memberId}::uuid AND "status" IN ('DRAFT','SUBMITTED','REVIEWING')
        ORDER BY "created_at" DESC LIMIT 1
      `);
      if (!rows[0]) throw error;
      return rows[0];
    }
  }

  private parseDataUrl(value: string) {
    const match = String(value ?? '').match(/^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
    if (!match || !MIME_TO_EXT[match[1]]) {
      throw new BadRequestException('KYC document must be JPEG, PNG, WebP, or PDF');
    }
    const data = Buffer.from(match[2], 'base64');
    if (!data.length) throw new BadRequestException('KYC document is empty');
    if (data.length > MAX_BYTES) throw new BadRequestException('KYC document exceeds 10 MB');
    return { mimeType: match[1], data };
  }

  private safeFileName(value: string) {
    const name = String(value ?? '').replace(/[\\/\0\r\n]/g, '_').trim().slice(0, 255);
    if (!name) throw new BadRequestException('Invalid file name');
    return name;
  }

  private databaseErrorCode(error: unknown) {
    return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
  }
}
