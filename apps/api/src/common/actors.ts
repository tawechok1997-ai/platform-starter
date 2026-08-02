export type AdminActor = {
  id: string;
  permissions?: string[];
  deniedPermissions?: string[];
};

export type AuthenticatedAdminActor = {
  id: string;
  permissions: string[];
  deniedPermissions?: string[];
  sessionId: string;
  username?: string;
  roleCodes?: string[];
  twoFactorEnabled?: boolean;
  requiresTwoFactor?: boolean;
  scope?: Record<string, unknown>;
  approvalLimits?: Record<string, unknown>;
  teamIds?: string[];
  managerAdminId?: string | null;
  subordinateAdminIds?: string[];
};

export type MemberActor = {
  id: string;
  sessionId?: string;
};

type RequestHeaders = Record<string, string | string[] | undefined>;

export type HttpRequestContext = {
  ip?: string;
  headers?: RequestHeaders;
  socket?: { remoteAddress?: string };
  rawBody?: Buffer;
};

export type AdminRequestContext = HttpRequestContext & {
  user: AuthenticatedAdminActor;
};

export type MemberRequestContext = HttpRequestContext & {
  user: MemberActor;
};
