import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ANY_PERMISSIONS_KEY = 'required_any_permissions';

export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata(REQUIRED_ANY_PERMISSIONS_KEY, permissions);
