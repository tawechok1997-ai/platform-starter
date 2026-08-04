import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export const ADMIN_DASHBOARD_LAYOUT_PREFERENCE_KEY = 'dashboard-widget-layout-v1';
const ALLOWED_PREFERENCE_KEYS = new Set([ADMIN_DASHBOARD_LAYOUT_PREFERENCE_KEY]);
const MAX_PREFERENCE_BYTES = 50_000;

type PreferenceRow = {
  key: string;
  value: Prisma.JsonObject;
  version: number;
  updatedAt: Date;
};

@Injectable()
export class AdminUiPreferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async get(adminUserId: string, keyInput: string) {
    const key = this.preferenceKey(keyInput);
    const rows = await this.prisma.$queryRaw<PreferenceRow[]>(Prisma.sql`
      SELECT
        preference_key AS "key",
        value,
        version,
        updated_at AS "updatedAt"
      FROM admin_ui_preferences
      WHERE admin_user_id = ${adminUserId}::uuid
        AND preference_key = ${key}
      LIMIT 1
    `);
    const row = rows[0];
    return row
      ? { key: row.key, value: row.value, version: row.version, updatedAt: row.updatedAt.toISOString() }
      : { key, value: null, version: 0, updatedAt: null };
  }

  async upsert(adminUserId: string, keyInput: string, valueInput: Record<string, unknown>) {
    const key = this.preferenceKey(keyInput);
    const value = this.preferenceValue(valueInput);
    const rows = await this.prisma.$queryRaw<PreferenceRow[]>(Prisma.sql`
      INSERT INTO admin_ui_preferences (
        admin_user_id,
        preference_key,
        value
      ) VALUES (
        ${adminUserId}::uuid,
        ${key},
        ${JSON.stringify(value)}::jsonb
      )
      ON CONFLICT (admin_user_id, preference_key)
      DO UPDATE SET
        value = EXCLUDED.value,
        version = admin_ui_preferences.version + 1,
        updated_at = NOW()
      RETURNING
        preference_key AS "key",
        value,
        version,
        updated_at AS "updatedAt"
    `);
    const row = rows[0];
    if (!row) throw new BadRequestException('Admin UI preference could not be stored');
    return { key: row.key, value: row.value, version: row.version, updatedAt: row.updatedAt.toISOString() };
  }

  private preferenceKey(value: string) {
    const key = String(value ?? '').trim();
    if (!ALLOWED_PREFERENCE_KEYS.has(key)) {
      throw new BadRequestException('Unsupported Admin UI preference key');
    }
    return key;
  }

  private preferenceValue(value: Record<string, unknown>) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Admin UI preference value must be an object');
    }
    const serialized = JSON.stringify(value);
    if (Buffer.byteLength(serialized, 'utf8') > MAX_PREFERENCE_BYTES) {
      throw new BadRequestException('Admin UI preference value is too large');
    }
    return JSON.parse(serialized) as Record<string, unknown>;
  }
}
