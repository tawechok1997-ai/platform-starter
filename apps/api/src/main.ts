import 'reflect-metadata';
import { createHash, randomUUID } from 'crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import Redis from 'ioredis';
import { AppModule } from './app.module';
import { validateRuntimeEnvironment } from './common/config/runtime-env';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SensitiveResponseInterceptor } from './common/interceptors/sensitive-response.interceptor';
import { recordHttpMetric } from './common/observability/runtime-metrics';
import { buildStructuredLogRecord } from './common/observability/structured-log';
import { redactSensitiveUrl, toSafeLogRecord } from './common/security/sensitive-log-redactor';

type RateBucket = { count: number; resetAt: number };
type RateRule = {
  method: string;
  path: string;
  max: number;
  env?: string;
  prefix?: boolean;
  failClosedOnRedisError?: boolean;
};
type RateDecision = { allowed: boolean; retryAfterSeconds?: number };
type ResolvedRateLimit = { max: number; windowMs: number; failClosedOnRedisError: boolean };

const rateBuckets = new Map<string, RateBucket>();
const MAX_MEMORY_RATE_BUCKETS = 10_000;
const RATE_RULES: RateRule[] = [
  { method: 'POST', path: '/member/auth/login', max: 10, env: 'RATE_LIMIT_MEMBER_LOGIN_PER_MINUTE', failClosedOnRedisError: true },
  { method: 'POST', path: '/member/auth/register', max: 8, env: 'RATE_LIMIT_MEMBER_REGISTER_PER_MINUTE', failClosedOnRedisError: true },
  {
    method: 'POST',
    path: '/member/auth/password-reset/request',
    max: 5,
    env: 'RATE_LIMIT_PASSWORD_RESET_REQUEST_PER_MINUTE',
    failClosedOnRedisError: true,
  },
  {
    method: 'POST',
    path: '/member/auth/password-reset/confirm',
    max: 5,
    env: 'RATE_LIMIT_PASSWORD_RESET_CONFIRM_PER_MINUTE',
    failClosedOnRedisError: true,
  },
  { method: 'POST', path: '/admin/auth/login', max: 10, env: 'RATE_LIMIT_ADMIN_LOGIN_PER_MINUTE', failClosedOnRedisError: true },
  { method: 'POST', path: '/admin/auth/2fa/verify', max: 10, env: 'RATE_LIMIT_ADMIN_2FA_PER_MINUTE', failClosedOnRedisError: true },
  { method: 'POST', path: '/admin/auth/refresh', max: 30, env: 'RATE_LIMIT_ADMIN_REFRESH_PER_MINUTE' },
  { method: 'POST', path: '/member/topups', max: 20, env: 'RATE_LIMIT_TOPUPS_PER_MINUTE', failClosedOnRedisError: true },
  { method: 'POST', path: '/member/topups/slip', max: 12, env: 'RATE_LIMIT_SLIP_UPLOAD_PER_MINUTE', failClosedOnRedisError: true },
  { method: 'POST', path: '/member/withdrawals', max: 12, env: 'RATE_LIMIT_WITHDRAWALS_PER_MINUTE', failClosedOnRedisError: true },
  {
    method: 'POST',
    path: '/provider-webhooks/',
    max: 120,
    env: 'RATE_LIMIT_PROVIDER_WEBHOOK_PER_MINUTE',
    prefix: true,
    failClosedOnRedisError: true,
  },
];

let redis: Redis | null = null;

async function bootstrap() {
  validateRuntimeEnvironment();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get(ConfigService);
  const trustedProxyHops = readTrustedProxyHops(
    config.get<string>('TRUSTED_PROXY_HOPS') ?? process.env.TRUSTED_PROXY_HOPS,
  );
  app.getHttpAdapter().getInstance().set('trust proxy', trustedProxyHops);
  redis = createRedisClient(config.get<string>('REDIS_URL') ?? process.env.REDIS_URL);

  app.enableCors({
    origin: [
      config.get<string>('MEMBER_WEB_URL') ?? 'http://localhost:3000',
      config.get<string>('ADMIN_WEB_URL') ?? 'http://localhost:3001',
    ],
    credentials: true,
  });

  app.use((req: any, res: any, next: any) => {
    const requestId = String(req.headers?.['x-request-id'] ?? randomUUID());
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new SensitiveResponseInterceptor());

  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.use(async (req: any, res: any, next: any) => {
    const limit = getRateLimit(req.method, req.path ?? req.url ?? '');
    if (!limit) return next();

    const ip = getClientIp(req);
    const path = String(req.path ?? req.url ?? '').split('?')[0];
    const keys = getRateLimitKeys(req, ip, path);
    for (const key of keys) {
      const decision = await checkRateLimit(
        key,
        limit.max,
        limit.windowMs,
        limit.failClosedOnRedisError,
      );
      if (!decision.allowed) {
        res.setHeader('Retry-After', String(decision.retryAfterSeconds ?? 60));
        return res.status(429).json({ message: 'Too many requests', requestId: req.requestId });
      }
    }
    return next();
  });

  app.use((req: any, res: any, next: any) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startedAt;
      const record = toSafeLogRecord(buildStructuredLogRecord({
        event: 'http_request',
        requestId: req.requestId,
        method: req.method,
        path: redactSensitiveUrl(req.originalUrl ?? req.url ?? ''),
        statusCode: res.statusCode,
        durationMs: duration,
        ip: getClientIp(req),
        userAgent: req.headers?.['user-agent'] ?? null,
        actor: req.user,
      }));
      recordHttpMetric(record);
      console.log(JSON.stringify(record));
    });
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? config.get<string>('API_PORT') ?? 4000);
  await app.listen(port, '0.0.0.0');
}

function getRateLimitKeys(req: any, ip: string, path: string) {
  const routeKey = createHash('sha256').update(`${req.method}:${path}`).digest('hex').slice(0, 16);
  const keys = [`route:${routeKey}:ip:${ip}`];
  if (!/\/(?:admin\/)?auth\/(?:login|register)$/.test(path)) return keys;

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const identity = [body.identifier, body.username, body.email, body.phone].find(
    (value) => typeof value === 'string' && value.trim().length > 0,
  );
  if (!identity) return keys;

  const accountHash = createHash('sha256').update(String(identity).trim().toLowerCase()).digest('hex').slice(0, 32);
  keys.push(`route:${routeKey}:account:${accountHash}`);
  return keys;
}

function getRateLimit(method: string, path: string): ResolvedRateLimit | null {
  const verb = String(method).toUpperCase();
  const normalizedPath = String(path).split('?')[0];
  const matched = RATE_RULES.find(
    (rule) =>
      verb === rule.method && (rule.prefix ? normalizedPath.startsWith(rule.path) : normalizedPath === rule.path),
  );
  if (!matched) return null;
  const envValue = matched.env ? process.env[matched.env] : undefined;
  const max = Number(envValue ?? process.env.RATE_LIMIT_PER_MINUTE ?? matched.max);
  return {
    max: Number.isFinite(max) && max > 0 ? max : matched.max,
    windowMs: 60_000,
    failClosedOnRedisError: matched.failClosedOnRedisError === true,
  };
}

async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  failClosedOnRedisError: boolean,
): Promise<RateDecision> {
  if (redis) {
    try {
      const redisKey = `rate:${key}`;
      const result = await redis.eval(
        [
          "local count = redis.call('INCR', KEYS[1])",
          "if count == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
          "local ttl = redis.call('PTTL', KEYS[1])",
          'return {count, ttl}',
        ].join('\n'),
        1,
        redisKey,
        String(windowMs),
      );
      const values = Array.isArray(result) ? result : [];
      const count = Number(values[0] ?? 0);
      const ttl = Number(values[1] ?? windowMs);
      if (count <= max) return { allowed: true };
      return { allowed: false, retryAfterSeconds: Math.max(Math.ceil(ttl / 1000), 1) };
    } catch (error) {
      console.error(
        JSON.stringify(
          toSafeLogRecord({
            level: 'error',
            event: 'redis_rate_limit_failed',
            failClosed: failClosedOnRedisError,
            error,
          }),
        ),
      );
      if (failClosedOnRedisError && process.env.NODE_ENV === 'production') {
        return { allowed: false, retryAfterSeconds: 60 };
      }
    }
  }
  return checkMemoryRateLimit(key, max, windowMs);
}

function checkMemoryRateLimit(key: string, max: number, windowMs: number): RateDecision {
  const now = Date.now();
  cleanupExpiredBuckets(now);
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    enforceMemoryBucketLimit();
    return { allowed: true };
  }
  bucket.count += 1;
  if (bucket.count <= max) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}

function createRedisClient(url?: string | null) {
  if (!url) return null;
  const client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 1, enableReadyCheck: false });
  client.on('error', (error) =>
    console.error(
      JSON.stringify(
        toSafeLogRecord({
          level: 'error',
          event: 'redis_client_error',
          error,
        }),
      ),
    ),
  );
  client.connect().catch((error) =>
    console.error(
      JSON.stringify(
        toSafeLogRecord({
          level: 'error',
          event: 'redis_connect_failed',
          error,
        }),
      ),
    ),
  );
  return client;
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}

function enforceMemoryBucketLimit() {
  while (rateBuckets.size > MAX_MEMORY_RATE_BUCKETS) {
    const oldestKey = rateBuckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    rateBuckets.delete(oldestKey);
  }
}

function readTrustedProxyHops(value?: string | number | null) {
  const hops = Number(value ?? 0);
  return Number.isInteger(hops) && hops >= 0 ? hops : 0;
}

function getClientIp(req: any) {
  return String(req.ip ?? req.socket?.remoteAddress ?? 'unknown');
}

bootstrap();
