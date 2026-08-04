import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  enforceAdminSensitiveAction,
  requestSensitiveActionPolicy,
} from '../admin-sensitive-action-enforcement';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

const SUPER_PERMISSION = '*';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ACCESS_SENSITIVE_PERMISSIONS = new Set([
  'admin.access.manage',
  'admin.permissions.override',
  'admin.access.delegate',
  'admin.subordinates.manage',
  'admin.teams.manage',
]);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const permissions: string[] = request.user?.permissions ?? [];
    const deniedPermissions: string[] = request.user?.deniedPermissions ?? [];
    const hasWildcardDeny = deniedPermissions.includes(SUPER_PERMISSION);
    const hasRequiredDeny = required.some((permission) => deniedPermissions.includes(permission));

    if (hasWildcardDeny || hasRequiredDeny) {
      throw new ForbiddenException('Permission denied');
    }

    const hasSuperAccess = permissions.includes(SUPER_PERMISSION);
    const allowed = hasSuperAccess || required.every((permission) => permissions.includes(permission));

    if (!allowed) {
      throw new ForbiddenException('Permission denied');
    }

    this.enforceSensitiveMutation(request, required, permissions);
    return true;
  }

  private enforceSensitiveMutation(
    request: any,
    required: readonly string[],
    permissions: readonly string[],
  ) {
    const method = String(request.method ?? '').toUpperCase();
    if (!MUTATION_METHODS.has(method)) return;

    const path = this.requestPath(request);
    const permission = required[0];
    if (!permission || !this.isSensitiveMutation(path, permission, request.headers)) return;

    const actorAdminUserId = String(request.user?.id ?? '').trim();
    const actorSessionId = String(request.user?.sessionId ?? '').trim();
    if (!actorAdminUserId || !actorSessionId) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'ADMIN_SENSITIVE_ACTION_CONTEXT_MISSING',
        message: 'Sensitive admin action requires an authenticated session context',
      });
    }

    const enforced = enforceAdminSensitiveAction(
      requestSensitiveActionPolicy({
        action: this.actionName(method, path),
        requiredPermission: permission,
        requireReason: this.requiresReason(method, path),
      }),
      {
        actorAdminUserId,
        actorSessionId,
        actorPermissions: permissions,
        requesterAdminUserId: actorAdminUserId,
        targetAdminUserId: this.targetAdminUserId(request),
        reason: this.requestReason(request),
      },
    );

    request.adminSensitiveActionAudit = enforced.auditEvidence;
  }

  private isSensitiveMutation(path: string, permission: string, headers: any) {
    if (path.startsWith('/admin/access/') && ACCESS_SENSITIVE_PERMISSIONS.has(permission)) {
      return true;
    }

    if (this.header(headers, 'x-admin-settings-impact') === 'sensitive') return true;
    if (path.startsWith('/admin/settings/')) {
      return permission.startsWith('settings.') && (permission.endsWith('.update') || permission.endsWith('.publish'));
    }

    return [
      '/admin/provider-credentials',
      '/admin/provider-presets',
      '/admin/game-providers',
      '/admin/providers',
      '/admin/game-api-settings',
      '/admin/maintenance',
      '/admin/feature-flags',
    ].some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  }

  private requiresReason(method: string, path: string) {
    if (path.endsWith('/ownership-transfer')) return true;
    if (method === 'PATCH' && path.endsWith('/permission-overrides')) return true;
    if (path.endsWith('/access-profile')) return true;
    if (path.endsWith('/reporting-line')) return false;
    if (path.endsWith('/status')) return true;
    if (method === 'PATCH' && path.endsWith('/roles')) return true;
    if (method === 'DELETE' && /\/roles\/[^/]+$/.test(path)) return true;
    if (path.endsWith('/delegations')) return true;
    if (path.endsWith('/revoke')) return true;
    if (method === 'DELETE' && /\/sessions\/[^/]+$/.test(path)) return true;
    return false;
  }

  private requestPath(request: any) {
    const raw = String(request.originalUrl ?? request.url ?? request.path ?? '').split('?')[0];
    const apiTrimmed = raw.replace(/^\/api(?=\/admin\/)/, '');
    return apiTrimmed.startsWith('/') ? apiTrimmed : `/${apiTrimmed}`;
  }

  private requestReason(request: any) {
    const reason = request.body && typeof request.body === 'object' ? request.body.reason : null;
    return typeof reason === 'string' ? reason : null;
  }

  private targetAdminUserId(request: any) {
    const candidate = request.params?.adminUserId
      ?? request.params?.targetAdminId
      ?? request.body?.targetAdminId
      ?? request.body?.adminUserId
      ?? null;
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
  }

  private actionName(method: string, path: string) {
    return `admin.request.${method.toLowerCase()}.${path.replace(/^\/admin\//, '').replace(/[^a-z0-9]+/gi, '.')}`;
  }

  private header(headers: any, name: string) {
    const value = headers?.[name] ?? headers?.[name.toLowerCase()];
    return Array.isArray(value) ? String(value[0] ?? '').toLowerCase() : String(value ?? '').toLowerCase();
  }
}
