type AdminIdentity = {
  id: string;
  username: string;
  email: string | null;
};

type AdminActivityRecord = {
  id: string;
  adminUserId: string | null;
  action: string;
  module: string;
  targetId: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  adminUser?: AdminIdentity | null;
};

export function mapAdminActivity(item: AdminActivityRecord) {
  return {
    id: item.id,
    adminUserId: item.adminUserId,
    action: item.action,
    module: item.module,
    targetId: item.targetId,
    oldData: item.oldData,
    newData: item.newData,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
    createdAt: item.createdAt,
    adminUser: item.adminUser ?? null,
  };
}
