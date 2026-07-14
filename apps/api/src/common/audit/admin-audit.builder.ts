import { Prisma } from '@prisma/client';

export type AdminAuditContext = {
  adminUserId: string;
  module: string;
  action: string;
  targetId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string;
  userAgent?: string;
};

export function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

export function buildAdminAuditData(context: AdminAuditContext): Prisma.AdminAuditLogCreateInput {
  return {
    adminUser: { connect: { id: context.adminUserId } },
    module: context.module,
    action: context.action,
    targetId: context.targetId ?? null,
    oldData: toAuditJson(context.oldData),
    newData: toAuditJson(context.newData),
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  };
}
