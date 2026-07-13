import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminActor } from '../../common/actors';
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
      settings: this.toKeyValueObject(settings),
    };
  }

  async updateAdminGroup(group: string, body: Record<string, unknown>, actor: AdminActor, meta: RequestMeta) {
    const normalized = this.assertGroup(group);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Settings payload must be an object');
    }

    if (SENSITIVE_GROUPS.includes(normalized) && !actor.permissions?.includes('settings.scripts.update')) {
      throw new ForbiddenException('Sensitive settings permission required');
    }

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
        data: {
          adminUserId: actor.id,
          action: 'settings.update',
          module: 'settings',
          targetId: settingKey,
          oldData: oldSetting?.valueJson ?? Prisma.JsonNull,
          newData: setting.valueJson ?? Prisma.JsonNull,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
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

  private assertGroup(group: string): SettingGroupSlug {
    const normalized = group.toLowerCase();
    if (!isSettingGroup(normalized)) throw new NotFoundException('Settings group not found');
    return normalized;
  }

  private makeKey(group: SettingGroupSlug, key: string) {
    return `${group}.${this.toSnakeCase(key)}`;
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
