import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

export type SignedStoragePayload = {
  key: string;
  contentType: string;
  fileName?: string;
  expiresAt: number;
};

@Injectable()
export class StorageSignedAccessService {
  issue(input: Omit<SignedStoragePayload, 'expiresAt'>, ttlSeconds = this.defaultTtlSeconds()) {
    const boundedTtl = Math.min(Math.max(Math.floor(ttlSeconds), 30), 900);
    const payload: SignedStoragePayload = {
      ...input,
      expiresAt: Math.floor(Date.now() / 1000) + boundedTtl,
    };
    const encoded = this.encode(payload);
    return {
      token: `${encoded}.${this.sign(encoded)}`,
      expiresAt: new Date(payload.expiresAt * 1000).toISOString(),
      ttlSeconds: boundedTtl,
    };
  }

  verify(token: string): SignedStoragePayload {
    const separator = token.lastIndexOf('.');
    if (separator <= 0) throw new UnauthorizedException('Invalid storage access token');
    const encoded = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    const expected = this.sign(encoded);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
      throw new UnauthorizedException('Invalid storage access token');
    }

    let payload: SignedStoragePayload;
    try {
      payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SignedStoragePayload;
    } catch {
      throw new UnauthorizedException('Invalid storage access token');
    }
    if (!payload.key || !payload.contentType || !Number.isInteger(payload.expiresAt)) {
      throw new UnauthorizedException('Invalid storage access token');
    }
    if (payload.expiresAt <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Storage access token expired');
    }
    return payload;
  }

  private encode(payload: SignedStoragePayload) {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }

  private sign(encoded: string) {
    return createHmac('sha256', this.secret()).update(encoded).digest('base64url');
  }

  private secret() {
    const value = process.env.STORAGE_SIGNING_SECRET
      ?? process.env.JWT_SECRET
      ?? process.env.ADMIN_JWT_SECRET
      ?? process.env.MEMBER_JWT_SECRET;
    if (!value || value.length < 32) {
      throw new BadRequestException('Storage signing secret is not configured');
    }
    return value;
  }

  private defaultTtlSeconds() {
    const parsed = Number(process.env.STORAGE_SIGNED_URL_TTL_SECONDS ?? 300);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 300;
  }
}
