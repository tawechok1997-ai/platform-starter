import type { ReactNode, SVGProps } from 'react';
import type { IconKey } from '../site-settings';

const iconPaths: Record<IconKey, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  deposit: <><rect x="3" y="5" width="18" height="14" rx="4" /><path d="M12 8v8m-4-4h8" /></>,
  withdraw: <><rect x="3" y="5" width="18" height="14" rx="4" /><path d="M8 12h8m-3-3 3 3-3 3" /></>,
  games: <><path d="M8 8h8a5 5 0 0 1 4.7 6.7l-1 2.8a2.5 2.5 0 0 1-4.1 1l-1.4-1.4H9.8l-1.4 1.4a2.5 2.5 0 0 1-4.1-1l-1-2.8A5 5 0 0 1 8 8Z" /><path d="M8 11v4M6 13h4m6-1h.01M18 14h.01" /></>,
  bonus: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></>,
  affiliate: <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="16" r="3" /><path d="M10.5 9.5 14.5 14M5 19a5 5 0 0 1 5-5" /></>,
  support: <><path d="M5 6h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 3v-4a2 2 0 0 1-1-1V8a2 2 0 0 1 2-2Z" /><path d="M8 11h8M8 14h5" /></>,
  history: <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8" /><path d="M4 4v4h4m4-1v5l3 2" /></>,
  bank: <><path d="m3 10 9-6 9 6M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  notification: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  promotion: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8v12M3 12h18M7.5 8C5 8 5 4 7.5 4 10 4 12 8 12 8s2-4 4.5-4S19 8 16.5 8" /></>,
  vip: <><path d="m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Z" /><path d="M7 15h10" /></>,
  wallet: <><path d="M4 6h13a3 3 0 0 1 3 3v9H5a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h10" /><path d="M15 11h6v4h-6a2 2 0 0 1 0-4Z" /></>,
};

export function MemberIcon({ name, ...props }: { name: IconKey } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{iconPaths[name]}</svg>;
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>; }
export function CloseIcon(props: SVGProps<SVGSVGElement>) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" {...props}><path d="M6 6l12 12M18 6 6 18" /></svg>; }
