import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permission.decorator';

const SUPER_PERMISSION = '*';
const ACCESS_MANAGER_PERMISSION = 'admin.access.manage';

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
    const hasSuperAccess = permissions.includes(SUPER_PERMISSION) || permissions.includes(ACCESS_MANAGER_PERMISSION);
    const allowed = hasSuperAccess || required.every((permission) => permissions.includes(permission));

    if (!allowed) {
      throw new ForbiddenException('Permission denied');
    }

    return true;
  }
}
