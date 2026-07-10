import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv, createHmac, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { GameProviderEndpointType, GameProviderWalletMode } from './game-platform.types';
import { ProviderAdapterContext } from './provider-adapter.interface';
import { ProviderAdapterRegistry } from './adapters/provider-adapter.registry';

type TestMethod = 'healthCheck' | 'launchGame' | 'getBalance' | 'transferIn' | 'transferOut' | 'syncGames' | 'getBetHistory' | 'validateWebhook' | 'parseWebhook';
type ProviderForAdapter = { code: string; walletMode: GameProviderWalletMode; currency: string; endpoints: Array<{ type: GameProviderEndpointType; url: string; timeoutMs: number }>; credentials: Array<{ type: string; maskedValue: string; encryptedValue?: string }> };

@Injectable()
export class AdapterTestService {
  constructor(private readonly prisma: PrismaService, private readonly registry: ProviderAdapterRegistry, private readonly configService: ConfigService) {}
  async listMethods(providerId: string) { const provider = await this.provider(providerId); return { provider: { code: provider.code, adapterRegistered: this.registry.hasAdapter(provider.code) }, methods: ['healthCheck', 'launchGame', 'getBalance', 'transferIn', 'transferOut', 'syncGames', 'getBetHistory', 'validateWebhook', 'parseWebhook'] satisfies TestMethod[] }; }
  async run(providerId: string, method: TestMethod, payload: Record<string, unknown> = {}) {
    const provider = await this.provider(providerId); const adapter = this.registry.getAdapter(provider.code); const context = this.context(provider); const started = Date.now(); const idempotencyKey = String(payload.idempotencyKey ?? `adapter_test_${Date.now()}`);
    let result: unknown;
    if (method === 'healthCheck') result = await adapter.healthCheck(context);
    else if (method === 'launchGame') result = await adapter.launchGame(context, { userId: String(payload.userId ?? 'adapter-test-user'), gameCode: String(payload.gameCode ?? 'demo-slot-001'), sessionId: String(payload.sessionId ?? `adapter-test-session-${Date.now()}`), ipAddress: String(payload.ipAddress ?? '127.0.0.1'), userAgent: String(payload.userAgent ?? 'adapter-test-harness'), returnUrl: typeof payload.returnUrl === 'string' ? payload.returnUrl : undefined });
    else if (method === 'getBalance') result = await adapter.getBalance(context, { userId: String(payload.userId ?? 'adapter-test-user'), providerUserId: typeof payload.providerUserId === 'string' ? payload.providerUserId : undefined });
    else if (method === 'transferIn') result = await adapter.transferIn(context, { userId: String(payload.userId ?? 'adapter-test-user'), providerUserId: typeof payload.providerUserId === 'string' ? payload.providerUserId : undefined, amount: String(payload.amount ?? '1.00'), currency: String(payload.currency ?? provider.currency), idempotencyKey, sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : undefined });
    else if (method === 'transferOut') result = await adapter.transferOut(context, { userId: String(payload.userId ?? 'adapter-test-user'), providerUserId: typeof payload.providerUserId === 'string' ? payload.providerUserId : undefined, amount: String(payload.amount ?? '1.00'), currency: String(payload.currency ?? provider.currency), idempotencyKey, sessionId: typeof payload.sessionId === 'string' ? payload.sessionId : undefined });
    else if (method === 'syncGames') result = await adapter.syncGames(context);
    else if (method === 'getBetHistory') result = await adapter.getBetHistory(context, { from: String(payload.from ?? new Date(Date.now() - 86400000).toISOString()), to: String(payload.to ?? new Date().toISOString()), cursor: typeof payload.cursor === 'string' ? payload.cursor : undefined });
    else if (method === 'validateWebhook') { const body = payload.body ?? { eventType: 'adapter.test', idempotencyKey }; const timestamp = String(payload.timestamp ?? new Date().toISOString()); const signature = typeof payload.signature === 'string' ? payload.signature : this.sign(context, body, timestamp); result = await adapter.validateWebhook(context, { 'x-timestamp': timestamp, 'x-signature': signature, 'x-provider-timestamp': timestamp, 'x-provider-signature': signature }, body); }
    else if (method === 'parseWebhook') result = await adapter.parseWebhook(context, payload.body ?? { eventType: 'adapter.test', idempotencyKey, providerTransactionId: `tx_${idempotencyKey}` });
    else throw new BadRequestException('Unsupported adapter test method');
    return { ok: true, provider: { id: providerId, code: provider.code }, method, latencyMs: Date.now() - started, result: this.sanitize(result), input: this.sanitize(payload), checkedAt: new Date().toISOString() };
  }
  private async provider(providerId: string) { const item = await this.prisma.gameProvider.findUnique({ where: { id: providerId }, include: { endpoints: { where: { isEnabled: true }, orderBy: { type: 'asc' } }, credentials: { where: { isEnabled: true }, orderBy: { type: 'asc' }, select: { id: true, type: true, maskedValue: true, encryptedValue: true, isEnabled: true } } } }); if (!item) throw new NotFoundException('Game provider not found'); return item; }
  private context(provider: ProviderForAdapter): ProviderAdapterContext { const endpointMap = provider.endpoints.reduce<Partial<Record<GameProviderEndpointType, string>>>((map, endpoint) => { map[endpoint.type] = endpoint.url; return map; }, {}); const credentialMap = provider.credentials.reduce<Record<string, string>>((map, credential) => { map[credential.type] = credential.encryptedValue ? this.decrypt(credential.encryptedValue) : credential.maskedValue; return map; }, {}); return { providerCode: provider.code, baseUrl: endpointMap.HEALTH_CHECK ?? endpointMap.LAUNCH ?? '', walletMode: provider.walletMode, currency: provider.currency, timeoutMs: Math.max(...provider.endpoints.map((endpoint) => endpoint.timeoutMs), 10000), endpointMap, credentialMap }; }
  private decrypt(value: string) { const [, ivRaw, tagRaw, encryptedRaw] = value.split(':'); if (!ivRaw || !tagRaw || !encryptedRaw) return value; const decipher = createDecipheriv('aes-256-gcm', this.credentialKey(), Buffer.from(ivRaw, 'base64')); decipher.setAuthTag(Buffer.from(tagRaw, 'base64')); return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, 'base64')), decipher.final()]).toString('utf8'); }
  private credentialKey() { const keySource = this.configService.get<string>('GAME_CREDENTIAL_SECRET') ?? this.configService.get<string>('JWT_ACCESS_KEY') ?? 'local_game_credential_key'; return createHash('sha256').update(keySource).digest(); }
  private sign(context: ProviderAdapterContext, body: unknown, timestamp: string) { const secret = context.credentialMap.SECRET_KEY || context.credentialMap.WEBHOOK_SECRET || context.credentialMap.API_KEY || 'adapter-test-secret'; return createHmac('sha256', secret).update(`${timestamp}.${JSON.stringify(body)}`).digest('hex'); }
  private sanitize(value: unknown) { return JSON.parse(JSON.stringify(value, (key, item) => ['apiKey', 'secret', 'signature', 'API_KEY', 'SECRET_KEY', 'WEBHOOK_SECRET', 'encryptedValue', 'credentialMap'].includes(key) ? '[REDACTED]' : item)); }
}
