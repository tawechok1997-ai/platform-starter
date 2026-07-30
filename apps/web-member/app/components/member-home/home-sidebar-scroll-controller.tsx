'use client';

/**
 * Legacy compatibility component.
 *
 * The desktop Home sidebar is now owned entirely by
 * member-home-sidebar-primary.css using native position: sticky. Keeping scroll,
 * resize and mutation observers here caused the sidebar to switch between
 * absolute and fixed positioning while the page was loading or resizing.
 */
export default function HomeSidebarScrollController() {
  return null;
}
