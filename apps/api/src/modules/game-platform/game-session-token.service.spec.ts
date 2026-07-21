import { UnauthorizedException } from '@nestjs/common';
import { GameSessionTokenService } from './game-session-token.service';

describe('GameSessionTokenService', () => {
  const service = new GameSessionTokenService();

  it('issues a random token and stores only a deterministic hash', () => {
    const issued = service.issue(60_000);
    expect(issued.token).toBeTruthy();
    expect(issued.tokenHash).toHaveLength(64);
    expect(issued.tokenHash).toBe(service.hash(issued.token));
    expect(issued.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('verifies a valid unexpired token', () => {
    const issued = service.issue(60_000);
    expect(service.verify(issued.token, issued.tokenHash, issued.expiresAt)).toBe(true);
  });

  it('rejects mismatched, expired, and revoked tokens', () => {
    const issued = service.issue(60_000);
    expect(() => service.verify('wrong-token', issued.tokenHash, issued.expiresAt)).toThrow(UnauthorizedException);
    expect(() => service.verify(issued.token, issued.tokenHash, new Date(Date.now() - 1))).toThrow('expired');
    expect(() => service.verify(issued.token, issued.tokenHash, issued.expiresAt, new Date())).toThrow('revoked');
  });

  it('rejects invalid TTL values', () => {
    expect(() => service.issue(0)).toThrow('TTL must be greater than zero');
    expect(() => service.issue(Number.NaN)).toThrow('TTL must be greater than zero');
  });
});
