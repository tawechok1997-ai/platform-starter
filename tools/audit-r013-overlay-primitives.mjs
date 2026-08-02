import { readFile } from 'node:fs/promises';

const files = {
  contract: 'packages/design-tokens/overlays.css',
  adminLayout: 'apps/web-admin/app/layout.tsx',
  memberLayout: 'apps/web-member/app/layout.tsx',
  authOverlay: 'apps/web-member/app/components/auth/member-auth-overlay.tsx',
  memberDocumentLock: 'apps/web-member/app/lib/member-document-overlay-lock.ts',
  confirm: 'apps/web-member/src/features/finance/finance-components.tsx',
};

const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])));
const failures = [];
const requireText = (key, value, label = value) => { if (!source[key].includes(value)) failures.push(`${key}: missing ${label}`); };

for (const selector of ['.ui-overlay', '.ui-modal', '.ui-confirm-dialog', '.ui-drawer', '.ui-overlay-surface__header', '.ui-overlay-surface__body', '.ui-overlay-surface__actions']) requireText('contract', selector);
for (const key of ['adminLayout', 'memberLayout']) requireText(key, 'packages/design-tokens/overlays.css', 'shared overlay import');

for (const value of ['createPortal', 'member-auth-overlay', 'role="dialog"', 'aria-modal="true"', 'aria-busy={!frameReady}', 'member-auth-overlay__frame']) requireText('authOverlay', value);
for (const behavior of ["event.key === 'Escape'", 'acquireMemberDocumentOverlayLock', 'const releaseDocumentLock = acquireMemberDocumentOverlayLock()', 'releaseDocumentLock()', 'event.origin !== window.location.origin']) requireText('authOverlay', behavior, `auth overlay behavior ${behavior}`);
for (const behavior of [
  'let activeLockCount = 0',
  "body.style.overflow = 'hidden'",
  "html.style.overflow = 'hidden'",
  'body.style.overflow = snapshot.bodyOverflow',
  'html.style.overflow = snapshot.htmlOverflow',
  'restoreDocumentStyles()',
]) requireText('memberDocumentLock', behavior, `member document lock behavior ${behavior}`);

for (const value of ['ui-overlay', 'ui-confirm-dialog', 'role="dialog"', 'aria-modal="true"', 'aria-labelledby={titleId}', 'ui-overlay-surface__header', 'ui-overlay-surface__body', 'ui-overlay-surface__actions']) requireText('confirm', value);
for (const behavior of ["event.key === 'Escape'", "event.key !== 'Tab'", 'returnFocusRef.current?.focus()', "document.body.style.overflow = 'hidden'"]) requireText('confirm', behavior, `confirm behavior ${behavior}`);

if (failures.length) {
  console.error('R-013 overlay primitive contract failed:\n' + failures.map((item) => `- ${item}`).join('\n'));
  process.exit(1);
}
console.log('R-013 overlay primitive contract passed.');
