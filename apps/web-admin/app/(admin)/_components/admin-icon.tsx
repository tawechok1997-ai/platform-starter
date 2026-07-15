import type { ReactNode, SVGProps } from 'react';

type AdminIconName =
  | 'activity' | 'bank' | 'chevron-left' | 'close' | 'dashboard' | 'game'
  | 'logout' | 'menu' | 'money' | 'report' | 'risk' | 'search'
  | 'security' | 'settings' | 'support' | 'user' | 'wallet';

const paths: Record<AdminIconName, ReactNode> = {
  activity: <><path d="M4 12h3l2-5 4 10 2-5h5" /><path d="M4 5v14h16" /></>,
  bank: <><path d="m3 10 9-6 9 6" /><path d="M5 10v8m4-8v8m6-8v8m4-8v8M3 20h18" /></>,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
  game: <><path d="M8 8h8a5 5 0 0 1 4.7 6.7l-1 2.8a2.5 2.5 0 0 1-4.1 1l-1.4-1.4H9.8l-1.4 1.4a2.5 2.5 0 0 1-4.1-1l-1-2.8A5 5 0 0 1 8 8Z" /><path d="M8 11v4M6 13h4m6-1h.01M18 14h.01" /></>,
  logout: <><path d="M10 5H5v14h5" /><path d="m14 8 4 4-4 4m4-4H9" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  money: <><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M7 12h.01M17 12h.01M12 9v6m2-4.5c-.5-1-3-1-3 0s3 1 3 2-2.5 1-3 0" /></>,
  report: <><path d="M5 20V10m7 10V4m7 16v-7" /><path d="M3 20h18" /></>,
  risk: <><path d="M12 3 3.5 19h17L12 3Z" /><path d="M12 9v4m0 3h.01" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  security: <><path d="M12 3 5 6v5c0 4.8 2.7 8 7 10 4.3-2 7-5.2 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  support: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 1-1 1.7m0 3h.01" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  wallet: <><path d="M4 6h13a3 3 0 0 1 3 3v9H5a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h10" /><path d="M15 11h6v4h-6a2 2 0 0 1 0-4Z" /></>,
};

export function AdminIcon({ name, ...props }: { name: AdminIconName } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}

export function iconForAdminHref(href: string): AdminIconName {
  if (href === '/dashboard' || href === '/operations') return 'dashboard';
  if (href.includes('topup') || href.includes('withdraw') || href.includes('finance')) return 'money';
  if (href.includes('wallet') || href.includes('ledger')) return 'wallet';
  if (href.includes('member') || href.includes('account') || href.includes('kyc')) return 'user';
  if (href.includes('bank')) return 'bank';
  if (href.includes('risk') || href.includes('audit')) return 'risk';
  if (href.includes('game') || href.includes('provider') || href.includes('adapter')) return 'game';
  if (href.includes('report') || href.includes('export')) return 'report';
  if (href.includes('security') || href.includes('anti-bot')) return 'security';
  if (href.includes('setting') || href.includes('content')) return 'settings';
  if (href.includes('support')) return 'support';
  return 'activity';
}
