import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { isDomainError } from '../errors/domain-error';
import { mapDomainErrorToHttp } from '../errors/domain-error-http.mapper';
import { resolveApiErrorCode } from '../errors/error-code-resolver';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId = request?.requestId ?? response?.getHeader?.('X-Request-Id') ?? null;

    const domainPayload = isDomainError(exception) ? mapDomainErrorToHttp(exception) : null;
    const status = domainPayload?.status
      ?? (exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR);
    const payload = domainPayload
      ?? (exception instanceof HttpException ? exception.getResponse() : null);
    const message = domainPayload?.message ?? this.resolveMessage(payload, exception);
    const safePayload = this.safePayload(payload);
    const code = domainPayload?.code
      ?? (typeof safePayload.code === 'string' ? safePayload.code : resolveApiErrorCode(message));

    if (status >= 500) {
      console.error(JSON.stringify({
        level: 'error',
        event: 'http_exception',
        requestId,
        method: request?.method,
        path: request?.originalUrl ?? request?.url,
        statusCode: status,
        code: code ?? null,
        message,
      }));
    }

    response.status(status).json({
      ...safePayload,
      ...(code ? { code } : {}),
      statusCode: status,
      message,
      error: status >= 500 ? 'Internal Server Error' : this.resolveError(payload),
      requestId,
      timestamp: new Date().toISOString(),
      path: request?.originalUrl ?? request?.url,
    });
  }

  private safePayload(payload: unknown) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
    const source = payload as Record<string, unknown>;
    const allowed: Record<string, unknown> = {};
    for (const key of ['retryAfter', 'code', 'messageKey', 'details']) {
      if (source[key] !== undefined) allowed[key] = source[key];
    }
    return allowed;
  }

  private resolveMessage(payload: unknown, exception: unknown) {
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const value = (payload as { message?: unknown }).message;
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'string') return value;
    }
    if (exception instanceof Error && exception.message) return exception.message;
    return 'Unexpected error';
  }

  private resolveError(payload: unknown) {
    if (payload && typeof payload === 'object' && 'error' in payload) {
      const value = (payload as { error?: unknown }).error;
      if (typeof value === 'string') return value;
    }
    return 'Error';
  }
}
