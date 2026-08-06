export const MEMBER_OPEN_AUTH_EVENT = 'member:auth-open';
export const MEMBER_LEGACY_OPEN_AUTH_EVENT = 'member:open-auth';

export type MemberAuthMode = 'login' | 'register';
export type MemberAuthRequestId = string;

export type MemberOpenAuthDetail = {
  mode: MemberAuthMode;
  next?: string;
  requestId: MemberAuthRequestId;
};

let authRequestSequence = 0;

export function createMemberAuthRequestId() {
  authRequestSequence = (authRequestSequence + 1) % Number.MAX_SAFE_INTEGER;
  return `${Date.now().toString(36)}-${authRequestSequence.toString(36)}`;
}

export function openMemberAuth(mode: MemberAuthMode, next?: string) {
  if (typeof window === 'undefined') return null;

  const safeNext = safeNextTarget(next);
  const detail: MemberOpenAuthDetail = {
    mode,
    requestId: createMemberAuthRequestId(),
    ...(safeNext ? { next: safeNext } : {}),
  };

  window.dispatchEvent(new CustomEvent<MemberOpenAuthDetail>(MEMBER_OPEN_AUTH_EVENT, { detail }));
  return detail.requestId;
}

export function normalizeMemberOpenAuthDetail(value: unknown): MemberOpenAuthDetail | null {
  if (!value || typeof value !== 'object') return null;

  const detail = value as Partial<MemberOpenAuthDetail>;
  if (detail.mode !== 'login' && detail.mode !== 'register') return null;

  return {
    mode: detail.mode,
    requestId: typeof detail.requestId === 'string' && detail.requestId.trim()
      ? detail.requestId
      : createMemberAuthRequestId(),
    ...(safeNextTarget(detail.next) ? { next: safeNextTarget(detail.next) } : {}),
  };
}

export function safeNextTarget(value?: unknown) {
  const next = typeof value === 'string' ? value.trim() : '';
  return next.startsWith('/') && !next.startsWith('//') ? next : undefined;
}
