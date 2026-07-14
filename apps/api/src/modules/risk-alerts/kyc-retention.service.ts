import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class KycRetentionService {
  constructor(private readonly prisma: PrismaService, private readonly storage: StorageService) {}

  async cleanupExpired(limit = 100) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const rows = await this.prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      SELECT * FROM "kyc_documents" WHERE "deleted_at" IS NULL AND "retention_until" <= CURRENT_TIMESTAMP
      ORDER BY "retention_until" ASC LIMIT ${safeLimit}
    `);

    let deleted = 0;
    let storageFailures = 0;
    for (const row of rows) {
      try {
        await this.storage.remove(String(row.storage_key));
      } catch {
        storageFailures += 1;
        continue;
      }
      const changed = await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "kyc_documents" SET "status"='EXPIRED', "deleted_at"=CURRENT_TIMESTAMP,
          "version"="version"+1, "updated_at"=CURRENT_TIMESTAMP
        WHERE "id"=${String(row.id)}::uuid AND "deleted_at" IS NULL
      `);
      deleted += Number(changed);
    }

    return { scanned: rows.length, deleted, storageFailures };
  }
}
