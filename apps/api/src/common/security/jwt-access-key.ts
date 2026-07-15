import type { ConfigService } from '@nestjs/config';

const DEVELOPMENT_JWT_ACCESS_KEY = 'local_access_key';

export function resolveJwtAccessKey(config: Pick<ConfigService, 'get'>): string {
  const value = config.get<string>('JWT_ACCESS_KEY')?.trim() ?? process.env.JWT_ACCESS_KEY?.trim();
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_ACCESS_KEY is required in production');
  }
  return DEVELOPMENT_JWT_ACCESS_KEY;
}
