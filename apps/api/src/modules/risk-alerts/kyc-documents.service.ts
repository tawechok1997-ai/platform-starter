import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReviewKycCaseDto, ReviewKycDocumentDto, UploadKycDocumentDto } from './dto/kyc-document.dto';

const MAX_BYTES = 10 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

@Injectable()
export class KycDocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async memberCase(memberId: string) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "kyc_cases" WHERE "member_id" = ${memberId}::uuid
      ORDER BY "created_at" DESC LIMIT 1
    `);
    if (!rows[0]) return { item: null, documents: [] };
    return { item: this.caseItem(rows[0]), documents: await this.caseDocuments(rows[0].id, memberId) };
  }

  async upload(memberId: string, input: UploadKycDocumentDto) {
    const parsed = this.parseDataUrl(input.dataUrl);
    const sha256 = createHash('sha256').update(parsed.data).digest('hex');
    const caseRow = await this.getOrCreateDraftCase(memberId);
    if (caseRow.status !== 'DRAFT') throw new ConflictException('KYC case is not accepting documents');
    const key = `kyc/${memberId}/${caseRow.id}/${randomUUID()}.${MIME_TO_EXT[parsed.mimeType]}`;
    const retentionDays = Math.min(Math.max(Number(process.env.KYC_RETENTION_DAYS ?? 365), 30), 3650);
    const retentionUntil = new Date(Date.now() + retentionDays * 86400000);
    await this.storage.put(key, parsed.data, parsed.mimeType);
    try {
      const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        INSERT INTO "kyc_documents" (
          "case_id","member_id","document_type","storage_key","original_name","mime_type",
          "size_bytes","sha256","retention_until"
        ) VALUES (
          ${caseRow.id}::uuid, ${memberId}::uuid, ${input.documentType}, ${key},
          ${this.safeFileName(input.originalName)}, ${parsed.mimeType}, ${parsed.data.length}, ${sha256}, ${retentionUntil}
        ) RETURNING *
      `);
      return { item: this.documentItem(rows[0]) };
    } catch (error: any) {
      await this.storage.remove(key).catch(() => undefined);
      if (error?.code === '23505') throw new ConflictException('A current document of this type already exists');
      throw error;
    }
  }

  async submit(memberId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cases = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        SELECT * FROM "kyc_cases" WHERE "member_id" = ${memberId}::uuid AND "status" = 'DRAFT' FOR UPDATE
      `);
      const row = cases[0];
      if (!row) throw new NotFoundException('Draft KYC case not found');
      const docs = await tx.$queryRaw<Array<{ document_type: string }>>(Prisma.sql`
        SELECT "document_type" FROM "kyc_documents"
        WHERE "case_id" = ${row.id}::uuid AND "deleted_at" IS NULL AND "status" = 'UPLOADED'
      `);
      const types = new Set(docs.map((doc) => doc.document_type));
      const hasIdentity = types.has('PASSPORT') || (types.has('NATIONAL_ID_FRONT') && types.has('NATIONAL_ID_BACK'));
      if (!hasIdentity || !types.has('SELFIE')) throw new BadRequestException('Identity document and selfie are required');
      const updated = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        UPDATE "kyc_cases" SET "status"='SUBMITTED', "submitted_at"=CURRENT_TIMESTAMP,
          "version"="version"+1, "updated_at"=CURRENT_TIMESTAMP
        WHERE "id"=${row.id}::uuid AND "version"=${row.version}
        RETURNING *
      `);
      if (!updated[0]) throw new ConflictException('KYC case changed during submission');
      return { item: this.caseItem(updated[0]) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async adminList(status?: string, pageInput?: string, takeInput?: string) {
    const page = Math.max(Number(pageInput ?? 1) || 1, 1);
    const take = Math.min(Math.max(Number(takeInput ?? 50) || 50, 1), 100);
    const allowed = ['DRAFT','SUBMITTED','REVIEWING','APPROVED','REJECTED','EXPIRED'];
    if (status && !allowed.includes(status)) throw new BadRequestException('Invalid KYC status');
    const where = status ? Prisma.sql`WHERE c."status"=${status}` : Prisma.empty;
    const [items, counts] = await Promise.all([
      this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        SELECT c.*, u."username", u."phone", u."email",
          (SELECT COUNT(*)::int FROM "kyc_documents" d WHERE d."case_id"=c."id" AND d."deleted_at" IS NULL) AS "document_count"
        FROM "kyc_cases" c JOIN "users" u ON u."id"=c."member_id"
        ${where} ORDER BY c."created_at" DESC OFFSET ${(page - 1) * take} LIMIT ${take}
      `),
      this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(*)::bigint AS count FROM "kyc_cases" c ${where}
      `),
    ]);
    const total = Number(counts[0]?.count ?? 0);
    return { items: items.map((row) => ({ ...this.caseItem(row), member: { username: row.username, phone: row.phone, email: row.email }, documentCount: Number(row.document_count ?? 0) })), total, page, take, pageCount: Math.max(Math.ceil(total / take), 1) };
  }

  async adminGet(caseId: string) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT c.*, u."username", u."phone", u."email" FROM "kyc_cases" c
      JOIN "users" u ON u."id"=c."member_id" WHERE c."id"=${caseId}::uuid
    `);
    if (!rows[0]) throw new NotFoundException('KYC case not found');
    return { item: { ...this.caseItem(rows[0]), member: { username: rows[0].username, phone: rows[0].phone, email: rows[0].email } }, documents: await this.caseDocuments(caseId) };
  }

  async reviewDocument(documentId: string, input: ReviewKycDocumentDto, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        SELECT * FROM "kyc_documents" WHERE "id"=${documentId}::uuid FOR UPDATE
      `);
      const existing = rows[0];
      if (!existing || existing.deleted_at) throw new NotFoundException('KYC document not found');
      if (Number(existing.version) !== input.version) throw new ConflictException('KYC document changed by another reviewer');
      const updated = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        UPDATE "kyc_documents" SET "status"=${input.status}, "review_note"=${input.note ?? null},
          "reviewed_by_admin_id"=${adminId}::uuid, "reviewed_at"=CURRENT_TIMESTAMP,
          "version"="version"+1, "updated_at"=CURRENT_TIMESTAMP
        WHERE "id"=${documentId}::uuid AND "version"=${input.version}
        RETURNING *
      `);
      if (!updated[0]) throw new ConflictException('KYC document changed by another reviewer');
      await tx.adminAuditLog.create({ data: { adminUserId: adminId, module: 'kyc', action: 'REVIEW_KYC_DOCUMENT', targetId: documentId, oldData: { status: existing.status, version: existing.version }, newData: { status: input.status, note: input.note, version: input.version + 1 } } });
      return { item: this.documentItem(updated[0]) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async reviewCase(caseId: string, input: ReviewKycCaseDto, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`SELECT * FROM "kyc_cases" WHERE "id"=${caseId}::uuid FOR UPDATE`);
      const existing = rows[0];
      if (!existing) throw new NotFoundException('KYC case not found');
      if (Number(existing.version) !== input.version) throw new ConflictException('KYC case changed by another reviewer');
      if (!['SUBMITTED','REVIEWING'].includes(existing.status)) throw new ConflictException('KYC case is not reviewable');
      if (input.status === 'APPROVED') {
        const rejected = await tx.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
          SELECT COUNT(*)::bigint AS count FROM "kyc_documents"
          WHERE "case_id"=${caseId}::uuid AND "deleted_at" IS NULL AND "status" <> 'ACCEPTED'
        `);
        if (Number(rejected[0]?.count ?? 0) > 0) throw new BadRequestException('All KYC documents must be accepted before approval');
      }
      const reviewedAt = ['APPROVED','REJECTED'].includes(input.status) ? new Date() : null;
      const updated = await tx.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        UPDATE "kyc_cases" SET "status"=${input.status}, "review_note"=${input.note ?? null},
          "reviewed_by_admin_id"=${adminId}::uuid, "reviewed_at"=${reviewedAt},
          "version"="version"+1, "updated_at"=CURRENT_TIMESTAMP
        WHERE "id"=${caseId}::uuid AND "version"=${input.version} RETURNING *
      `);
      if (!updated[0]) throw new ConflictException('KYC case changed by another reviewer');
      await tx.adminAuditLog.create({ data: { adminUserId: adminId, module: 'kyc', action: 'REVIEW_KYC_CASE', targetId: caseId, oldData: { status: existing.status, version: existing.version }, newData: { status: input.status, note: input.note, version: input.version + 1 } } });
      return { item: this.caseItem(updated[0]) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  issueAccessToken(documentId: string, adminId: string) {
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const payload = Buffer.from(JSON.stringify({ documentId, adminId, expiresAt })).toString('base64url');
    return { token: `${payload}.${this.sign(payload)}`, expiresAt: new Date(expiresAt * 1000) };
  }

  async downloadWithToken(token: string, adminId: string) {
    const [payload, signature] = token.split('.');
    if (!payload || !signature || !this.safeEqual(signature, this.sign(payload))) throw new ForbiddenException('Invalid KYC access token');
    let decoded: { documentId: string; adminId: string; expiresAt: number };
    try { decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { throw new ForbiddenException('Invalid KYC access token'); }
    if (decoded.adminId !== adminId || decoded.expiresAt < Math.floor(Date.now() / 1000)) throw new ForbiddenException('Expired or unauthorized KYC access token');
    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "kyc_documents" WHERE "id"=${decoded.documentId}::uuid AND "deleted_at" IS NULL
    `);
    if (!rows[0]) throw new NotFoundException('KYC document not found');
    const stored = await this.storage.get(rows[0].storage_key, rows[0].mime_type);
    await this.prisma.adminAuditLog.create({ data: { adminUserId: adminId, module: 'kyc', action: 'DOWNLOAD_KYC_DOCUMENT', targetId: decoded.documentId, newData: { access: 'token', expiresAt: decoded.expiresAt } } });
    return { dataUrl: `data:${stored.contentType};base64,${stored.data.toString('base64')}`, fileName: rows[0].original_name, mimeType: stored.contentType };
  }

  async cleanupExpired(limit = 100) {
    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "kyc_documents" WHERE "deleted_at" IS NULL AND "retention_until" <= CURRENT_TIMESTAMP
      ORDER BY "retention_until" ASC LIMIT ${Math.min(Math.max(limit, 1), 500)}
    `);
    let deleted = 0;
    for (const row of rows) {
      await this.storage.remove(row.storage_key).catch(() => undefined);
      const changed = await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "kyc_documents" SET "status"='EXPIRED', "deleted_at"=CURRENT_TIMESTAMP,
          "version"="version"+1, "updated_at"=CURRENT_TIMESTAMP
        WHERE "id"=${row.id}::uuid AND "deleted_at" IS NULL
      `);
      deleted += Number(changed);
    }
    return { deleted };
  }

  private async getOrCreateDraftCase(memberId: string) {
    const current = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "kyc_cases" WHERE "member_id"=${memberId}::uuid AND "status" IN ('DRAFT','SUBMITTED','REVIEWING')
      ORDER BY "created_at" DESC LIMIT 1
    `);
    if (current[0]) return current[0];
    try {
      const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        INSERT INTO "kyc_cases" ("member_id") VALUES (${memberId}::uuid) RETURNING *
      `);
      return rows[0];
    } catch (error: any) {
      if (error?.code !== '23505') throw error;
      const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        SELECT * FROM "kyc_cases" WHERE "member_id"=${memberId}::uuid AND "status" IN ('DRAFT','SUBMITTED','REVIEWING') LIMIT 1
      `);
      return rows[0];
    }
  }

  private async caseDocuments(caseId: string, memberId?: string) {
    const memberClause = memberId ? Prisma.sql`AND "member_id"=${memberId}::uuid` : Prisma.empty;
    const rows = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT * FROM "kyc_documents" WHERE "case_id"=${caseId}::uuid ${memberClause} AND "deleted_at" IS NULL
      ORDER BY "created_at" DESC
    `);
    return rows.map((row) => this.documentItem(row));
  }

  private parseDataUrl(value: string) {
    const match = String(value ?? '').match(/^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
    if (!match || !MIME_TO_EXT[match[1]]) throw new BadRequestException('KYC document must be JPEG, PNG, WebP, or PDF');
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

  private sign(payload: string) {
    const secret = process.env.KYC_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 16) throw new BadRequestException('KYC access secret is not configured');
    return createHmac('sha256', secret).update(payload).digest('base64url');
  }

  private safeEqual(left: string, right: string) {
    const a = Buffer.from(left); const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private caseItem(row: Record<string, any>) {
    return { id: row.id, memberId: row.member_id, status: row.status, riskLevel: row.risk_level, submittedAt: row.submitted_at, reviewedAt: row.reviewed_at, reviewNote: row.review_note, version: Number(row.version ?? 1), createdAt: row.created_at, updatedAt: row.updated_at };
  }

  private documentItem(row: Record<string, any>) {
    return { id: row.id, caseId: row.case_id, memberId: row.member_id, documentType: row.document_type, status: row.status, originalName: row.original_name, mimeType: row.mime_type, sizeBytes: Number(row.size_bytes), sha256: row.sha256, retentionUntil: row.retention_until, reviewedAt: row.reviewed_at, reviewNote: row.review_note, version: Number(row.version ?? 1), createdAt: row.created_at, updatedAt: row.updated_at };
  }
}