import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminActor } from '../../common/actors';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  GROUP_TO_PRISMA,
  HIGH_RISK_KEYS,
  PUBLIC_GROUPS,
  SENSITIVE_GROUPS,
  SettingGroupSlug,
  isSettingGroup,
} from './settings.constants';

export type RequestMeta = { ipAddress?: string; userAgent?: string };

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicSettings(group?: string) {
    if (group) {
      const normalized = this.assertGroup(group);
      if (!PUBLIC_GROUPS.includes(normalized)) throw new NotFoundException('Public settings group not found');
      return this.getPublicGroup(normalized);
    }

    const settings = await this.prisma.siteSetting.findMany({
      where: { isPublic: true, isSensitive: false },
      orderBy: { key: 'asc' },
    });

    return this.toGroupedObject(settings);
  }

  async getAdminGroup(group: string) {
    const normalized = this.assertGroup(group);
    const settings = await this.prisma.siteSetting.findMany({
      where: { group: GROUP_TO_PRISMA[normalized] as any },
      orderBy: { key: 'asc' },
    });

    return {
      group: normalized,
      settings: this.toKeyValueObject(settings.filter((setting) => !this.isDraftKey(setting.key))),
    };
  }

  async getAdminDraft(group: string) {
    const normalized = this.assertGroup(group);
    const settings = await this.prisma.siteSetting.findMany({
      where: { group: GROUP_TO_PRISMA[normalized] as any },
      orderBy: { key: 'asc' },
    });

    return {
      group: normalized,
      settings: settings
        .filter((setting) => this.isDraftKey(setting.key))
        .reduce<Record<string, Prisma.JsonValue>>((result, setting) => {
          result[this.draftFieldFromKey(setting.key)] = setting.valueJson;
          return result;
        }, {}),
    };
  }

  async getAdminHistory(group: string, limit = 50) {
    const normalized = this.assertGroup(group);
    const boundedLimit = Math.min(Math.max(Number.isFinite(limit) ? Math.floor(limit) : 50, 1), 200);
    const history = await this.prisma.siteSettingHistory.findMany({
      where: { settingKey: { startsWith: `${normalized}.` } },
      orderBy: { createdAt: 'desc' },
      take: boundedLimit * 2,
    });

    return {
      group: normalized,
      history: history
        .filter((entry) => !this.isDraftKey(entry.settingKey))
        .slice(0, boundedLimit)
        .map((entry) => ({
          id: entry.id,
          settingKey: entry.settingKey,
          field: entry.settingKey.slice(normalized.length + 1),
          oldValue: entry.oldValueJson,
          newValue: entry.newValueJson,
          changedBy: entry.changedBy,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          createdAt: entry.createdAt,
        })),
    };
  }

  async saveAdminDraft(group: string, body: Record<string, unknown>, actor: AdminActor, meta: RequestMeta) {
    const normalized = this.assertGroup(group);
    this.assertPayload(body);
    this.assertSensitivePermission(normalized, actor);

    const entries = Object.entries(body).filter(([, value]) => value !== undefined);
    const updated: string[] = [];

    for (const [fieldKey, rawValue] of entries) {
      const settingKey = this.makeDraftKey(normalized, fieldKey);
      const oldSetting = await this.prisma.siteSetting.findUnique({ where: { key: settingKey } });
      const newValue = rawValue as Prisma.InputJsonValue;
      const setting = await this.prisma.siteSetting.upsert({
        where: { key: settingKey },
        update: {
          valueJson: newValue,
          group: GROUP_TO_PRISMA[normalized] as any,
          type: this.detectType(rawValue) as any,
          isPublic: false,
          isSensitive: this.isSensitive(normalized, fieldKey),
          updatedBy: actor.id,
        },
        create: {
          key: settingKey,
          valueJson: newValue,
          group: GROUP_TO_PRISMA[normalized] as any,
          type: this.detectType(rawValue) as any,
          isPublic: false,
          isSensitive: this.isSensitive(normalized, fieldKey),
          updatedBy: actor.id,
        },
      });

      await this.prisma.siteSettingHistory.create({
        data: {
          settingKey,
          oldValueJson: oldSetting?.valueJson ?? Prisma.JsonNull,
          newValueJson: setting.valueJson ?? Prisma.JsonNull,
          changedBy: actor.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
      await this.prisma.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          action: 'settings.draft.save',
          module: 'settings',
          targetId: settingKey,
          oldData: oldSetting?.valueJson ?? null,
          newData: setting.valueJson ?? null,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
      updated.push(setting.key);
    }

    return { success: true, group: normalized, updated, status: 'draft' };
  }

  async publishAdminDraft(group: string, actor: AdminActor, meta: RequestMeta) {
    const normalized = this.assertGroup(group);
    const draftSettings = (await this.prisma.siteSetting.findMany({
      where: { group: GROUP_TO_PRISMA[normalized] as any },
      orderBy: { key: 'asc' },
    })).filter((setting) => this.isDraftKey(setting.key));

    if (!draftSettings.length) throw new BadRequestException('No draft settings to publish');

    const requiresDualApproval = draftSettings.some((setting) => {
      const field = this.draftFieldFromKey(setting.key);
      return HIGH_RISK_KEYS.has(this.makeKey(normalized, field));
    });

    const published = await this.prisma.$transaction(async (tx) => {
      const keys: string[] = [];
      for (const draft of draftSettings) {
        const fieldKey = this.draftFieldFromKey(draft.key);
        const settingKey = this.makeKey(normalized, fieldKey);
        const oldSetting = await tx.siteSetting.findUnique({ where: { key: settingKey } });
        const setting = await tx.siteSetting.upsert({
          where: { key: settingKey },
          update: {
            valueJson: draft.valueJson as Prisma.InputJsonValue,
            group: GROUP_TO_PRISMA[normalized] as any,
            type: draft.type,
            isPublic: this.isPublic(normalized, fieldKey),
            isSensitive: this.isSensitive(normalized, fieldKey),
            updatedBy: actor.id,
          },
          create: {
            key: settingKey,
            valueJson: draft.valueJson as Prisma.InputJsonValue,
            group: GROUP_TO_PRISMA[normalized] as any,
            type: draft.type,
            isPublic: this.isPublic(normalized, fieldKey),
            isSensitive: this.isSensitive(normalized, fieldKey),
            updatedBy: actor.id,
          },
        });

        await tx.siteSettingHistory.create({
          data: {
            settingKey,
            oldValueJson: oldSetting?.valueJson ?? Prisma.JsonNull,
            newValueJson: setting.valueJson ?? Prisma.JsonNull,
            changedBy: actor.id,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          },
        });
        await tx.adminAuditLog.create({
          data: buildAdminAuditData({
            adminUserId: actor.id,
            action: 'settings.publish',
            module: 'settings',
            targetId: settingKey,
            oldData: oldSetting?.valueJson ?? null,
            newData: setting.valueJson ?? null,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          }),
        });
        await tx.siteSetting.delete({ where: { key: draft.key } });
        keys.push(setting.key);
      }
      return keys;
    });

    return {
      success: true,
      group: normalized,
      published,
      requiresDualApproval,
      cacheInvalidated: true,
      status: 'published',
    };
  }

  async rollbackAdminSetting(group: string, historyId: string, actor: AdminActor, meta: RequestMeta) {
    const normalized = this.assertGroup(group);
    const history = await this.prisma.siteSettingHistory.findUnique({ where: { id: historyId } });
    if (!history || !history.settingKey.startsWith(`${normalized}.`) || this.isDraftKey(history.settingKey)) {
      throw new NotFoundException('Settings history entry not found');
    }

    const fieldKey = history.settingKey.slice(normalized.length + 1);
    const rollbackValue = history.oldValueJson;
    const result = await this.prisma.$transaction(async (tx) => {
      const current = await tx.siteSetting.findUnique({ where: { key: history.settingKey } });
      if (rollbackValue === null) {
        if (current) await tx.siteSetting.delete({ where: { key: history.settingKey } });
      } else {
        await tx.siteSetting.upsert({
          where: { key: history.settingKey },
          update: {
            valueJson: rollbackValue as Prisma.InputJsonValue,
            group: GROUP_TO_PRISMA[normalized] as any,
            type: this.detectType(rollbackValue) as any,
            isPublic: this.isPublic(normalized, fieldKey),
            isSensitive: this.isSensitive(normalized, fieldKey),
            updatedBy: actor.id,
          },
          create: {
            key: history.settingKey,
            valueJson: rollbackValue as Prisma.InputJsonValue,
            group: GROUP_TO_PRISMA[normalized] as any,
            type: this.detectType(rollbackValue) as any,
            isPublic: this.isPublic(normalized, fieldKey),
            isSensitive: this.isSensitive(normalized, fieldKey),
            updatedBy: actor.id,
          },
        });
      }

      await tx.siteSettingHistory.create({
        data: {
          settingKey: history.settingKey,
          oldValueJson: current?.valueJson ?? Prisma.JsonNull,
          newValueJson: rollbackValue ?? Prisma.JsonNull,
          changedBy: actor.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
      await tx.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          action: 'settings.rollback',
          module: 'settings',
          targetId: history.settingKey,
          oldData: current?.valueJson ?? null,
          newData: rollbackValue,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
      return rollbackValue;
    });

    return { success: true, group: normalized, settingKey: history.settingKey, value: result, cacheInvalidated: true };
  }

  async updateAdminGroup(group: string, body: Record<string, unknown>, actor: AdminActor, meta: RequestMeta) {
    const normalized = this.assertGroup(group);
    this.assertPayload(body);
    this.assertSensitivePermission(normalized, actor);

    const entries = Object.entries(body).filter(([, value]) => value !== undefined);
    const requiresDualApproval = entries.some(([key]) => HIGH_RISK_KEYS.has(this.makeKey(normalized, key)));

    const updated: string[] = [];
    for (const [fieldKey, rawValue] of entries) {
      const settingKey = this.makeKey(normalized, fieldKey);
      const oldSetting = await this.prisma.siteSetting.findUnique({ where: { key: settingKey } });
      const newValue = rawValue as Prisma.InputJsonValue;
      const groupValue = GROUP_TO_PRISMA[normalized] as any;
      const typeValue = this.detectType(rawValue) as any;

      const setting = await this.prisma.siteSetting.upsert({
        where: { key: settingKey },
        update: {
          valueJson: newValue,
          group: groupValue,
          type: typeValue,
          isPublic: this.isPublic(normalized, fieldKey),
          isSensitive: this.isSensitive(normalized, fieldKey),
          updatedBy: actor.id,
        },
        create: {
          key: settingKey,
          valueJson: newValue,
          group: groupValue,
          type: typeValue,
          isPublic: this.isPublic(normalized, fieldKey),
          isSensitive: this.isSensitive(normalized, fieldKey),
          updatedBy: actor.id,
        },
      });

      await this.prisma.siteSettingHistory.create({
        data: {
          settingKey,
          oldValueJson: oldSetting?.valueJson ?? Prisma.JsonNull,
          newValueJson: setting.valueJson ?? Prisma.JsonNull,
          changedBy: actor.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });

      await this.prisma.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          action: 'settings.update',
          module: 'settings',
          targetId: settingKey,
          oldData: oldSetting?.valueJson ?? null,
          newData: setting.valueJson ?? null,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });

      updated.push(setting.key);
    }

    return {
      success: true,
      group: normalized,
      updated,
      requiresDualApproval,
      cacheInvalidated: true,
    };
  }

  private async getPublicGroup(group: SettingGroupSlug) {
    const settings = await this.prisma.siteSetting.findMany({
      where: { group: GROUP_TO_PRISMA[group] as any, isPublic: true, isSensitive: false },
      orderBy: { key: 'asc' },
    });
    return { group, settings: this.toKeyValueObject(settings) };
  }

  private assertPayload(body: Record<string, unknown>) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Settings payload must be an object');
    }
  }

  private assertSensitivePermission(group: SettingGroupSlug, actor: AdminActor) {
    if (SENSITIVE_GROUPS.includes(group) && !actor.permissions?.includes('settings.scripts.update')) {
      throw new ForbiddenException('Sensitive settings permission required');
    }
  }

  private assertGroup(group: string): SettingGroupSlug {
    const normalized = group.toLowerCase();
    if (!isSettingGroup(normalized)) throw new NotFoundException('Settings group not found');
    return normalized;
  }

  private makeKey(group: SettingGroupSlug, key: string) {
    return `${group}.${this.toSnakeCase(key)}`;
  }

  private makeDraftKey(group: SettingGroupSlug, key: string) {
    return `${group}.__draft_${this.toSnakeCase(key)}`;
  }

  private isDraftKey(key: string) {
    return key.includes('.__draft_');
  }

  private draftFieldFromKey(key: string) {
    const draftMarker = '.__draft_';
    const markerIndex = key.indexOf(draftMarker);
    return markerIndex >= 0 ? key.slice(markerIndex + draftMarker.length) : key;
  }

  private toSnakeCase(value: string) {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[\s.-]+/g, '_')
      .toLowerCase();
  }

  private detectType(value: unknown) {
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (typeof value === 'number') return 'NUMBER';
    if (typeof value === 'string') {
      if (/^#[0-9a-f]{6}$/i.test(value)) return 'COLOR';
      if (/^https?:\/\//i.test(value)) return 'URL';
      return 'STRING';
    }
    return 'JSON';
  }

  private isPublic(group: SettingGroupSlug, key: string) {
    if (group === 'scripts') return false;
    const normalizedKey = this.toSnakeCase(key);
    if (normalizedKey.startsWith('__draft_')) return false;
    const publicGroups: SettingGroupSlug[] = ['website', 'branding', 'theme', 'seo', 'contact', 'maintenance', 'features', 'legal'];
    const privateKeys = new Set(['admin_url']);
    return publicGroups.includes(group) && !privateKeys.has(normalizedKey);
  }

  private isSensitive(group: SettingGroupSlug, key: string) {
    if (group === 'scripts') return true;
    const normalizedKey = this.toSnakeCase(key);
    return normalizedKey.includes('secret') || normalizedKey.includes('token') || normalizedKey.includes('password');
  }

  private toKeyValueObject(settings: Array<{ key: string; valueJson: Prisma.JsonValue }>) {
    return settings.reduce<Record<string, Prisma.JsonValue>>((result, setting) => {
      const [, field] = setting.key.split('.');
      result[field] = setting.valueJson;
      return result;
    }, {});
  }

  private toGroupedObject(settings: Array<{ key: string; valueJson: Prisma.JsonValue }>) {
    return settings.reduce<Record<string, Record<string, Prisma.JsonValue>>>((result, setting) => {
      const [group, field] = setting.key.split('.');
      result[group] ??= {};
      result[group][field] = setting.valueJson;
      return result;
    }, {});
  }
}
