export const MOBILE_AVATAR_STORAGE_KEY = 'member_mobile_avatar_v1';
export const MOBILE_AVATAR_EVENT = 'member:mobile-avatar-changed';
export const DEFAULT_MOBILE_AVATAR = '/images/avatar/7.webp';
export const MOBILE_AVATAR_OPTIONS = Array.from(
  { length: 15 },
  (_, index) => `/images/avatar/${index + 1}.webp`,
) as readonly string[];

export function readMobileAvatarPreference() {
  if (typeof window === 'undefined') return DEFAULT_MOBILE_AVATAR;
  try {
    const value = window.localStorage.getItem(MOBILE_AVATAR_STORAGE_KEY)?.trim();
    return value && MOBILE_AVATAR_OPTIONS.includes(value) ? value : DEFAULT_MOBILE_AVATAR;
  } catch {
    return DEFAULT_MOBILE_AVATAR;
  }
}

export function writeMobileAvatarPreference(value: string) {
  const avatar = MOBILE_AVATAR_OPTIONS.includes(value) ? value : DEFAULT_MOBILE_AVATAR;
  if (typeof window === 'undefined') return avatar;
  try {
    window.localStorage.setItem(MOBILE_AVATAR_STORAGE_KEY, avatar);
  } catch {
    // The selected avatar still applies to the current page when storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent(MOBILE_AVATAR_EVENT, { detail: { avatar } }));
  return avatar;
}
