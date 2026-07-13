export type AdminActor = {
  id?: string;
  permissions?: string[];
};

export type AuthenticatedAdminActor = {
  id: string;
  permissions: string[];
};

export type MemberActor = {
  id: string;
};

export type RequestHeaders = Record<string, string | string[] | undefined>;

export type AdminRequestContext = {
  user: AuthenticatedAdminActor;
  ip?: string;
  headers?: RequestHeaders;
};

export type MemberRequestContext = {
  user: MemberActor;
  ip?: string;
  headers?: RequestHeaders;
};
