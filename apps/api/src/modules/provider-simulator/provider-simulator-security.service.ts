import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { ProviderSimulatorPersistenceRepository } from './provider-simulator-persistence.repository';

@Injectable()
export class ProviderSimulatorSecurityService {
  private readonly requests = new Map<string, number[]>();

  constructor(private readonly repository: ProviderSimulatorPersistenceRepository) {}

  async authenticate(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
    endpoint: string,
  ) {
    const apiKey = this.header(headers, 'x-api-key');
    const merchantId = this.header(headers, 'x-merchant-id');
    const timestamp = this.header(headers, 'x-timestamp');
    const nonce = this.header(headers, 'x-nonce');
    const signature = this.header(headers, 'x-signature');

    const expectedApiKey = this.requiredCredential('PROVIDER_SIMULATOR_API_KEY', 'simulator-api-key');
    const expectedMerchantId = this.requiredCredential('PROVIDER_SIMULATOR_MERCHANT_ID', 'simulator-merchant');
    const secret = this.requiredCredential('PROVIDER_SIMULATOR_SECRET', 'simulator-secret');

    if (apiKey !== expectedApiKey || merchantId !== expectedMerchantId) {
      throw new UnauthorizedException('Invalid simulator provider credentials');
    }

    const timestampValue = Date.parse(timestamp);
    if (!timestamp || !Number.isFinite(timestampValue) || Math.abs(Date.now() - timestampValue) > 5 * 60_000) {
      throw new UnauthorizedException('Simulator request timestamp is expired or invalid');
    }

    if (!/^[A-Za-z0-9._:-]{16,160}$/.test(nonce)) {
      throw new UnauthorizedException('Simulator request nonce is missing or invalid');
    }

    this.enforceRateLimit(`${merchantId}:${endpoint}`);

    const canonicalPayload = this.canonicalJson(body);
    const expected = createHmac('sha256', secret)
      .update(`${timestamp}.${nonce}.${canonicalPayload}`)
      .digest('hex');
    const actualBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const valid = actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
    if (!valid) throw new UnauthorizedException('Invalid simulator provider signature');

    await this.reserveNonce(merchantId, nonce, new Date(timestampValue));
  }

  canonicalJson(value: unknown): string {
    if (value === undefined) return 'null';
    if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
    if (Array.isArray(value)) return `[${value.map((item) => this.canonicalJson(item)).join(',')}]`;
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${this.canonicalJson(record[key])}`).join(',')}}`;
  }

  private async reserveNonce(merchantId: string, nonce: string, requestTimestamp: Date) {
    const expiresAt = new Date(requestTimestamp.getTime() + 10 * 60_000);
    try {
      await this.repository.reserveNonce(merchantId, nonce, requestTimestamp, expiresAt);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new UnauthorizedException('Simulator request nonce has already been used');
      }
      if (this.isUniqueViolation(error)) {
        throw new UnauthorizedException('Simulator request nonce has already been used');
      }
      throw error;
    }
  }

  private enforceRateLimit(key: string) {
    const now = Date.now();
    const windowMs = 60_000;
    const configured = Number(process.env.PROVIDER_SIMULATOR_RATE_LIMIT_PER_MINUTE ?? 120);
    const limit = Number.isFinite(configured) ? Math.min(Math.max(Math.trunc(configured), 10), 2_000) : 120;
    const recent = (this.requests.get(key) ?? []).filter((value) => now - value < windowMs);
    if (recent.length >= limit) {
      throw new HttpException('Provider simulator rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    recent.push(now);
    this.requests.set(key, recent);
  }

  private requiredCredential(name: string, developmentFallback: string) {
    const configured = process.env[name]?.trim();
    if (configured) return configured;
    const environment = (process.env.NODE_ENV ?? 'development').trim().toLowerCase();
    if (environment === 'development' || environment === 'test') return developmentFallback;
    throw new UnauthorizedException(`${name} must be configured outside development and test environments`);
  }

  private header(headers: Record<string, string | string[] | undefined>, key: string) {
    const value = headers[key];
    return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
  }

  private isUniqueViolation(error: unknown) {
    return Boolean(error && typeof error === 'object' && String((error as { code?: unknown }).code ?? '') === '23505');
  }
}
