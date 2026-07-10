import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createCipheriv, createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

type AdminActor = { id: string };
type RequestMeta = { ipAddress?: string; userAgent?: string };
type EndpointOverrideInput = { type?: string; url?: string };
type ApplyPresetInput = {
  presetCode: string;
  name: string;
  code: string;
  baseUrl: string;
  apiKey?: string;
  secretKey?: string;
  merchantId?: string;
  agentId?: string;
  webhookSecret?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'DEGRADED';
  enabledEndpoints?: string[];
  endpointOverrides?: EndpointOverrideInput[];
};

const PRESETS = {
  'demo-provider': { walletMode: 'TRANSFER', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'WEBHOOK_SECRET'], gates: { launchEnabled: true, transferEnabled: true, walletSyncEnabled: true, realMoneyEnabled: false, webhookSettlementEnabled: false } },
  'simulator-provider': { walletMode: 'TRANSFER', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'WEBHOOK_SECRET'], gates: { launchEnabled: true, transferEnabled: true, walletSyncEnabled: true, realMoneyEnabled: false, webhookSettlementEnabled: false } },
  'generic-transfer': { walletMode: 'TRANSFER', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'WEBHOOK_SECRET'], gates: { launchEnabled: true, transferEnabled: false, walletSyncEnabled: true, realMoneyEnabled: false, webhookSettlementEnabled: false } },
  'generic-seamless': { walletMode: 'SEAMLESS', endpoints: ['LAUNCH', 'BALANCE', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'AGENT_ID', 'WEBHOOK_SECRET'], gates: { launchEnabled: true, transferEnabled: false, walletSyncEnabled: false, realMoneyEnabled: false, webhookSettlementEnabled: false } },
  'real-provider': { walletMode: 'HYBRID', endpoints: ['LAUNCH', 'BALANCE', 'TRANSFER_IN', 'TRANSFER_OUT', 'GAME_LIST', 'BET_HISTORY', 'WEBHOOK', 'HEALTH_CHECK'], credentials: ['API_KEY', 'SECRET_KEY', 'MERCHANT_ID', 'AGENT_ID', 'WEBHOOK_SECRET'], gates: { launchEnabled: true, transferEnabled: false, walletSyncEnabled: true, realMoneyEnabled: false, webhookSettlementEnabled: false } },
} as const;

@Injectable()
export class ProviderPresetService {
  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {}
  listPresets() { return { items: Object.entries(PRESETS).map(([code, preset]) => ({ code, ...preset })) }; }
  async applyPreset(input: ApplyPresetInput, actor: AdminActor, meta: RequestMeta) {
    const preset = PRESETS[input.presetCode as keyof typeof PRESETS];
    if (!preset) throw new BadRequestException('Unknown provider preset');
    if (!input.name?.trim() || !input.code?.trim() || !input.baseUrl?.trim()) throw new BadRequestException('name, code and baseUrl are required');
    const endpointTypes = this.selectedEndpointTypes(preset.endpoints, input.enabledEndpoints);
    const overrideMap = this.endpointOverrideMap(preset.endpoints, input.endpointOverrides);
    try {
      const provider = await this.prisma.gameProvider.create({ data: { name: input.name.trim(), code: input.code.trim().toLowerCase(), status: input.status ?? 'INACTIVE', walletMode: preset.walletMode as any, currency: 'THB', timezone: 'Asia/Bangkok', sortOrder: 100, metadata: { presetCode: input.presetCode, ...preset.gates, enabledEndpointTypes: endpointTypes, endpointOverrideTypes: Array.from(overrideMap.keys()), appliedBy: actor.id, appliedAt: new Date().toISOString() } } });
      await this.prisma.gameProviderEndpoint.createMany({ data: endpointTypes.map((type) => ({ providerId: provider.id, type: type as any, url: overrideMap.get(type) ?? this.endpointUrl(input.baseUrl, type), method: 'POST', timeoutMs: 10000, retryCount: 2, isEnabled: true })), skipDuplicates: true });
      const secretValues: Record<string, string | undefined> = { API_KEY: input.apiKey, SECRET_KEY: input.secretKey, MERCHANT_ID: input.merchantId, AGENT_ID: input.agentId, WEBHOOK_SECRET: input.webhookSecret };
      const credentialRows = preset.credentials.map((type) => ({ providerId: provider.id, type: type as any, encryptedValue: this.encryptSecret(secretValues[type] || `TODO_${type}`), maskedValue: this.maskSecret(secretValues[type] || `TODO_${type}`), isEnabled: Boolean(secretValues[type]), rotatedAt: new Date() }));
      await this.prisma.gameProviderCredential.createMany({ data: credentialRows, skipDuplicates: true });
      await this.audit(actor, 'game_provider.preset.apply', provider.id, { presetCode: input.presetCode, providerCode: provider.code, enabledEndpointTypes: endpointTypes, endpointOverrideTypes: Array.from(overrideMap.keys()), credentialTypes: preset.credentials }, meta);
      const detail = await this.prisma.gameProvider.findUnique({ where: { id: provider.id }, include: { endpoints: { orderBy: { type: 'asc' } }, credentials: { orderBy: { type: 'asc' }, select: { id: true, type: true, maskedValue: true, isEnabled: true, rotatedAt: true } } } });
      return { ok: true, provider: detail };
    } catch (error) { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Provider code already exists'); throw error; }
  }
  private selectedEndpointTypes(presetEndpoints: readonly string[], enabledEndpoints?: string[]) {
    if (!enabledEndpoints) return [...presetEndpoints];
    const allowed = new Set(presetEndpoints);
    const selected = Array.from(new Set(enabledEndpoints.map((item) => item.trim().toUpperCase()).filter(Boolean)));
    const invalid = selected.filter((item) => !allowed.has(item));
    if (invalid.length > 0) throw new BadRequestException(`Unsupported endpoint type: ${invalid.join(', ')}`);
    if (selected.length === 0) throw new BadRequestException('At least one endpoint must be enabled');
    return selected;
  }
  private endpointOverrideMap(presetEndpoints: readonly string[], overrides?: EndpointOverrideInput[]) {
    const allowed = new Set(presetEndpoints);
    const map = new Map<string, string>();
    for (const item of overrides ?? []) {
      const type = item.type?.trim().toUpperCase();
      const url = item.url?.trim();
      if (!type || !url) continue;
      if (!allowed.has(type)) throw new BadRequestException(`Unsupported endpoint override type: ${type}`);
      map.set(type, url);
    }
    return map;
  }
  private endpointUrl(baseUrl: string, type: string) { const clean = baseUrl.replace(/\/+$/, ''); const slug = type.toLowerCase().replaceAll('_', '-'); return `${clean}/${slug}`; }
  private encryptSecret(value: string) { const keySource = this.configService.get<string>('GAME_CREDENTIAL_SECRET') ?? this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_game_credential_key'; const key = createHash('sha256').update(keySource).digest(); const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, iv); const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]); const tag = cipher.getAuthTag(); return `aes-256-gcm:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`; }
  private maskSecret(value: string) { if (value.length <= 8) return `${value.slice(0, 1)}••••${value.slice(-1)}`; return `${value.slice(0, 4)}••••${value.slice(-4)}`; }
  private async audit(actor: AdminActor, action: string, targetId: string, data: unknown, meta: RequestMeta) { await this.prisma.adminAuditLog.create({ data: { adminUserId: actor.id, action, module: 'game-platform', targetId, newData: JSON.parse(JSON.stringify(data)), ipAddress: meta.ipAddress, userAgent: meta.userAgent } }); }
}
