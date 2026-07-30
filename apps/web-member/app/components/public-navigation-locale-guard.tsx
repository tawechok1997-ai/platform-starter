'use client';

/**
 * Legacy locale guard retained as a no-op for compatibility.
 * The navigation labels now render directly from MemberLocaleProvider,
 * so observing and mutating the entire document body is no longer needed.
 */
export default function PublicNavigationLocaleGuard() {
  return null;
}
