export type AdminActor = {
  id?: string;
  permissions?: string[];
};

export type AuthenticatedAdminActor = {
  id: string;
  permissions: string[];
  sessionId: string;
  username?: string;
  roleCodes?: string[];
  twoFactorEnabled?: boolean;
  requiresTwoFactor?: boolean;
};

export type MemberActor = {
  id: string;
  sessionId?: string;
};

export type RequestHeaders = Record<string, string | string[] | undefined>;

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
