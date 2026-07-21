import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export type IssuedGameSessionToken = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

@Injectable()
export class GameSessionTokenService {
  issue(ttlMs = 15 * 60_000): IssuedGameSessionToken {
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new Error('Game session token TTL must be greater than zero');
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      tokenHash: this.hash(token),
      expiresAt: new Date(Date.now() + ttlMs),
    };
  }

  verify(token: string, expectedHash: string, expiresAt: Date, revokedAt?: Date | null) {
    if (!token || !expectedHash) throw new UnauthorizedException('Invalid game session token');
    if (revokedAt) throw new UnauthorizedException('Game session token has been revoked');
    if (expiresAt.getTime() <= Date.now()) throw new UnauthorizedException('Game session token has expired');

    const actual = Buffer.from(this.hash(token), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    const valid = actual.length === expected.length && timingSafeEqual(actual, expected);
    if (!valid) throw new UnauthorizedException('Invalid game session token');
    return true;
  }

  hash(token: string) {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }
}
