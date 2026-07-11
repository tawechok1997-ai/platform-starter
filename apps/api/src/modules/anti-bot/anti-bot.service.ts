import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

export type AntiBotProvider = 'TURNSTILE' | 'RECAPTCHA' | 'HCAPTCHA';
export type AntiBotRoute = 'ADMIN_LOGIN' | 'MEMBER_LOGIN' | 'MEMBER_REGISTER';

export type AntiBotConfig = {
  enabled: boolean;
  provider: AntiBotProvider;
  siteKey: string;
  secretConfigured: boolean;
  routes: Record<AntiBotRoute, boolean>;
  adaptiveMode: boolean;
  emergencyMode: boolean;
};

type StoredAntiBotConfig = Omit<AntiBotConfig, 'secretConfigured'> & {
  encryptedSecret?: string;
};

const SETTING_KEY = 'security.anti_bot';
const PROVIDERS = new Set<AntiBotProvider>(['TURNSTILE', 'RECAPTCHA', 'HCAPTCHA']);
const VERIFY_ENDPOINTS: Record<AntiBotProvider, string> = {
  TURNSTILE: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  RECAPTCHA: 'https://www.google.com/recaptcha/api/siteverify',
  HCAPTCHA: 'https://hcaptcha.com/siteverify',
};

const DEFAULT_CONFIG: StoredAntiBotConfig = {
  enabled: false,
  provider: 'TURNSTILE',
  siteKey: '',
  routes: { ADMIN_LOGIN: false, MEMBER_LOGIN: false, MEMBER_REGISTER: false },
  adaptiveMode: true,
  emergencyMode: false,
};

@Injectable()
export class AntiBotService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminConfig(): Promise<AntiBotConfig> {
    return this.sanitize(await this.getStoredConfig());
  }

  async getPublicConfig(route: AntiBotRoute) {
    const config = await this.getStoredConfig();
    const required = Boolean(this.runtimeEnabled() && config.enabled && config.routes[route]);
    return {
      enabled: required,
      provider: required ? config.provider : null,
      siteKey: required ? config.siteKey : '',
      adaptiveMode: config.adaptiveMode,
      emergencyMode: config.emergencyMode,
    };
  }

  async updateConfig(
    actorAdminId: string,
    input: Partial<AntiBotConfig> & { secret?: string },
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const previous = await this.getStoredConfig();
    const provider = input.provider ?? previous.provider;
    if (!PROVIDERS.has(provider)) throw new BadRequestException('Unsupported anti-bot provider');

    const next: StoredAntiBotConfig = {
      ...previous,
      enabled: input.enabled ?? previous.enabled,
      provider,
      siteKey: typeof input.siteKey === 'string' ? input.siteKey.trim() : previous.siteKey,
      routes: {
        ...previous.routes,
        ...(input.routes ?? {}),
      },
      adaptiveMode: input.adaptiveMode ?? previous.adaptiveMode,
      emergencyMode: input.emergencyMode ?? previous.emergencyMode,
    };

    const suppliedSecret = String(input.secret ?? '').trim();
    if (suppliedSecret) next.encryptedSecret = this.encryptSecret(suppliedSecret);

    if (next.enabled) {
      if (!next.siteKey) throw new BadRequestException('Site key is required before enabling anti-bot protection');
      if (!next.encryptedSecret) throw new BadRequestException('Secret key is required before enabling anti-bot protection');
      if (!Object.values(next.routes).some(Boolean)) throw new BadRequestException('Enable at least one protected route');
    }

    const oldSanitized = this.sanitize(previous);
    const newSanitized = this.sanitize(next);

    await this.prisma.$transaction(async (tx) => {
      await tx.siteSetting.upsert({
        where: { key: SETTING_KEY },
        update: {
          valueJson: next as unknown as Prisma.InputJsonValue,
          group: 'FEATURES',
          type: 'JSON',
          isPublic: false,
          isSensitive: true,
          updatedBy: actorAdminId,
        },
        create: {
          key: SETTING_KEY,
          valueJson: next as unknown as Prisma.InputJsonValue,
          group: 'FEATURES',
          type: 'JSON',
          isPublic: false,
          isSensitive: true,
          updatedBy: actorAdminId,
        },
      });
      await tx.siteSettingHistory.create({
        data: {
          settingKey: SETTING_KEY,
          oldValueJson: oldSanitized as unknown as Prisma.InputJsonValue,
          newValueJson: newSanitized as unknown as Prisma.InputJsonValue,
          changedBy: actorAdminId,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
      await tx.adminAuditLog.create({
        data: {
          adminUserId: actorAdminId,
          action: 'UPDATE_ANTI_BOT_CONFIG',
          module: 'anti-bot',
          targetId: SETTING_KEY,
          oldData: oldSanitized as unknown as Prisma.InputJsonObject,
          newData: newSanitized as unknown as Prisma.InputJsonObject,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    });

    return newSanitized;
  }

  async testProvider(
    actorAdminId: string,
    token: string,
    remoteIp: string | undefined,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const config = await this.getStoredConfig();
    if (!token?.trim()) throw new BadRequestException('A CAPTCHA response token is required for testing');
    let result: { success: boolean; provider: AntiBotProvider; errorCodes: string[] };
    try {
      result = await this.verifyWithProvider(config, token.trim(), remoteIp);
    } catch (error) {
      await this.auditSecurityEvent('ANTI_BOT_PROVIDER_UNAVAILABLE', config.provider, {
        route: 'ADMIN_TEST',
        reason: error instanceof ServiceUnavailableException ? 'PROVIDER_UNAVAILABLE' : 'VERIFICATION_ERROR',
      }, meta);
      throw error;
    }
    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId: actorAdminId,
        action: 'TEST_ANTI_BOT_PROVIDER',
        module: 'anti-bot',
        targetId: config.provider,
        newData: { success: result.success, errorCodes: result.errorCodes } as Prisma.InputJsonObject,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });
    return result;
  }

  async assertValid(route: AntiBotRoute, token: string | undefined, remoteIp?: string) {
    if (!this.runtimeEnabled()) return { required: false, success: true };
    const config = await this.getStoredConfig();
    if (!config.enabled || !config.routes[route]) return { required: false, success: true };
    if (!token?.trim()) throw new BadRequestException({ code: 'CAPTCHA_REQUIRED', message: 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ' });
    let result: { success: boolean; provider: AntiBotProvider; errorCodes: string[] };
    try {
      result = await this.verifyWithProvider(config, token.trim(), remoteIp);
    } catch (error) {
      await this.auditSecurityEvent('ANTI_BOT_PROVIDER_UNAVAILABLE', route, {
        provider: config.provider,
        reason: error instanceof ServiceUnavailableException ? 'PROVIDER_UNAVAILABLE' : 'VERIFICATION_ERROR',
      }, { ipAddress: remoteIp });
      throw error;
    }
    if (!result.success) {
      await this.auditSecurityEvent('ANTI_BOT_TOKEN_REJECTED', route, {
        provider: result.provider,
        errorCodes: result.errorCodes,
      }, { ipAddress: remoteIp });
      throw new BadRequestException({ code: 'CAPTCHA_INVALID', message: 'การยืนยันไม่สำเร็จ กรุณาลองใหม่' });
    }
    return { required: true, success: true };
  }

  private async auditSecurityEvent(
    action: string,
    targetId: string,
    newData: Prisma.InputJsonObject,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminUserId: null,
          action,
          module: 'anti-bot',
          targetId,
          newData,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      });
    } catch (error) {
      console.error('anti-bot security event audit failed', error);
    }
  }

  private runtimeEnabled() {
    return String(process.env.ANTIBOT_RUNTIME_ENABLED ?? '').trim().toLowerCase() === 'true';
  }

  private async verifyWithProvider(config: StoredAntiBotConfig, token: string, remoteIp?: string) {
    if (!config.encryptedSecret) throw new ServiceUnavailableException('Anti-bot secret is not configured');
    const secret = this.decryptSecret(config.encryptedSecret);
    const form = new URLSearchParams({ secret, response: token });
    if (remoteIp) form.set('remoteip', remoteIp);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(VERIFY_ENDPOINTS[config.provider], {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form,
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const errorCodes = Array.isArray(payload['error-codes']) ? payload['error-codes'].map(String) : [];
      return { success: response.ok && payload.success === true, provider: config.provider, errorCodes };
    } catch {
      throw new ServiceUnavailableException('Anti-bot provider verification is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getStoredConfig(): Promise<StoredAntiBotConfig> {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    if (!setting || !setting.valueJson || typeof setting.valueJson !== 'object' || Array.isArray(setting.valueJson)) return { ...DEFAULT_CONFIG, routes: { ...DEFAULT_CONFIG.routes } };
    const raw = setting.valueJson as unknown as Partial<StoredAntiBotConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...raw,
      routes: { ...DEFAULT_CONFIG.routes, ...(raw.routes ?? {}) },
    };
  }

  private sanitize(config: StoredAntiBotConfig): AntiBotConfig {
    return {
      enabled: config.enabled,
      provider: config.provider,
      siteKey: config.siteKey,
      secretConfigured: Boolean(config.encryptedSecret),
      routes: { ...config.routes },
      adaptiveMode: config.adaptiveMode,
      emergencyMode: config.emergencyMode,
    };
  }

  private encryptionKey() {
    const raw = process.env.ANTIBOT_ENCRYPTION_KEY;
    if (!raw) throw new ServiceUnavailableException('ANTIBOT_ENCRYPTION_KEY is required to store anti-bot secrets');
    return createHash('sha256').update(raw).digest();
  }

  private encryptSecret(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
  }

  private decryptSecret(value: string) {
    const [version, ivRaw, tagRaw, encryptedRaw] = value.split('.');
    if (version !== 'v1' || !ivRaw || !tagRaw || !encryptedRaw) throw new ServiceUnavailableException('Stored anti-bot secret is invalid');
    const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey(), Buffer.from(ivRaw, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64url')), decipher.final()]).toString('utf8');
  }
}
