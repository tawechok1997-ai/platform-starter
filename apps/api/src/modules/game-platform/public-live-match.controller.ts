import { Controller, Get, Injectable, Query, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type CacheEntry = {
  expiresAt: number;
  payload: unknown;
};

const LIVE_MATCH_CACHE_MS = 15_000;
const LIVE_MATCH_TIMEOUT_MS = 8_000;
const DEFAULT_TIMEZONE = 'Asia/Bangkok';
const DEFAULT_SPORT = 'football';

@Injectable()
export class PublicLiveMatchService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly config: ConfigService) {}

  async list(timezoneInput?: string, sportInput?: string) {
    const timezone = normalizeTimezone(timezoneInput);
    const sport = normalizeSport(sportInput);
    const cacheKey = `${timezone}:${sport}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.payload;

    const upstream = this.config.get<string>('LIVE_MATCH_API_URL')?.trim();
    if (!upstream) return emptyPayload(timezone);

    let url: URL;
    try {
      url = new URL(upstream);
    } catch {
      throw new ServiceUnavailableException('LIVE_MATCH_API_URL is invalid');
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new ServiceUnavailableException('LIVE_MATCH_API_URL must use http or https');
    }

    url.searchParams.set('timezone', timezone);
    url.searchParams.set('sport', sport);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIVE_MATCH_TIMEOUT_MS);

    try {
      const headers: Record<string, string> = { accept: 'application/json' };
      const token = this.config.get<string>('LIVE_MATCH_API_TOKEN')?.trim();
      const apiKey = this.config.get<string>('LIVE_MATCH_API_KEY')?.trim();
      if (token) headers.authorization = `Bearer ${token}`;
      if (apiKey) headers['x-api-key'] = apiKey;

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (response.status === 204 || response.status === 404) {
        return this.store(cacheKey, emptyPayload(timezone));
      }

      if (!response.ok) {
        throw new ServiceUnavailableException(`Central live match API returned ${response.status}`);
      }

      const payload = await response.json().catch(() => null);
      return this.store(cacheKey, payload ?? emptyPayload(timezone));
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      const message = error instanceof Error && error.name === 'AbortError'
        ? 'Central live match API timed out'
        : 'Central live match API is unavailable';
      throw new ServiceUnavailableException(message);
    } finally {
      clearTimeout(timer);
    }
  }

  private store(key: string, payload: unknown) {
    if (this.cache.size >= 32) this.cache.clear();
    this.cache.set(key, { expiresAt: Date.now() + LIVE_MATCH_CACHE_MS, payload });
    return payload;
  }
}

@Controller('games/live-events')
export class PublicLiveMatchController {
  constructor(private readonly service: PublicLiveMatchService) {}

  @Get()
  list(
    @Query('timezone') timezone?: string,
    @Query('sport') sport?: string,
  ) {
    return this.service.list(timezone, sport);
  }
}

function normalizeTimezone(value?: string) {
  const timezone = String(value ?? DEFAULT_TIMEZONE).trim() || DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function normalizeSport(value?: string) {
  const sport = String(value ?? DEFAULT_SPORT).trim().toLowerCase();
  return /^[a-z0-9_-]{1,32}$/.test(sport) ? sport : DEFAULT_SPORT;
}

function emptyPayload(timezone: string) {
  return {
    items: [],
    timezone,
    updatedAt: new Date().toISOString(),
  };
}
