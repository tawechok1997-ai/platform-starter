export const MEMBER_OPEN_AUTH_EVENT = 'member:open-auth';

export type MemberOpenAuthDetail = {
  mode: 'login' | 'register';
  next?: string;
};

export function openMemberAuth(mode: MemberOpenAuthDetail['mode'], next?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<MemberOpenAuthDetail>(MEMBER_OPEN_AUTH_EVENT, {
    detail: { mode, next },
  }));
}
