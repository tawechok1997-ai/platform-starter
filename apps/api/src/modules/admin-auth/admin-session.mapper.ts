export type AdminSessionRecord = {
  id: string;
  deviceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};

export function mapAdminSession(
  session: AdminSessionRecord,
  currentSessionId: string,
  now: Date = new Date(),
) {
  return {
    id: session.id,
    deviceId: session.deviceId,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt,
    current: session.id === currentSessionId,
    active: !session.revokedAt && session.expiresAt > now,
  };
}
