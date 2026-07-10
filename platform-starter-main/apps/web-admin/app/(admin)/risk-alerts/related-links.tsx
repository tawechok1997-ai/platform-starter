import { AdminEmpty, AdminLinkButton, AdminRow, AdminStack } from '../_components/admin-ui';

type RiskReference = {
  memberId?: string | null;
  shortMemberId?: string | null;
  refType?: string | null;
  refId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function RiskRelatedLinks({ item }: { item: RiskReference }) {
  const links = buildRelatedLinks(item);
  if (links.length === 0) return <AdminEmpty>ไม่มี reference เพิ่มเติม</AdminEmpty>;
  return <AdminStack>{links.map((link) => <AdminRow key={`${link.label}-${link.href}`}><div><strong>{link.label}</strong>{link.helper && <p>{link.helper}</p>}</div><AdminLinkButton href={link.href}>Open</AdminLinkButton></AdminRow>)}</AdminStack>;
}

function buildRelatedLinks(item: RiskReference) {
  const links: { label: string; href: string; helper?: string }[] = [];
  if (item.memberId) links.push({ label: 'Member detail', href: `/members/${item.memberId}`, helper: item.shortMemberId ?? item.memberId.slice(0, 8) });

  const refHref = hrefForRef(item.refType, item.refId);
  if (refHref) links.push({ label: labelForRef(item.refType), href: refHref, helper: item.refId ? shortId(item.refId) : undefined });

  const metadata = item.metadata ?? {};
  addMetadataLink(links, 'topUpId', metadata.topUpId, '/topups', 'Top-up queue');
  addMetadataListLink(links, 'topUpIds', metadata.topUpIds, '/topups', 'Top-up queue');
  addMetadataLink(links, 'withdrawalId', metadata.withdrawalId, '/withdrawals', 'Withdrawal queue');
  addMetadataListLink(links, 'withdrawalIds', metadata.withdrawalIds, '/withdrawals', 'Withdrawal queue');
  addMetadataLink(links, 'walletId', metadata.walletId, '/wallets', 'Wallets');
  addMetadataLink(links, 'bankAccountId', metadata.bankAccountId, '/bank-accounts', 'Bank accounts');
  return dedupe(links);
}

function hrefForRef(refType?: string | null, refId?: string | null) {
  if (!refType) return null;
  if (refType === 'topup_request' || refType === 'top_up_request') return '/topups';
  if (refType === 'withdrawal_request') return '/withdrawals';
  if (refType === 'wallet') return '/wallets';
  if (refType === 'bank_account' || refType === 'member_bank_account') return '/bank-accounts';
  if (refType === 'user' && refId) return `/members/${refId}`;
  return null;
}

function labelForRef(refType?: string | null) {
  if (refType === 'topup_request' || refType === 'top_up_request') return 'Related top-up';
  if (refType === 'withdrawal_request') return 'Related withdrawal';
  if (refType === 'wallet') return 'Related wallet';
  if (refType === 'bank_account' || refType === 'member_bank_account') return 'Related bank account';
  return 'Reference';
}

function addMetadataLink(links: { label: string; href: string; helper?: string }[], key: string, value: unknown, href: string, label: string) {
  if (typeof value === 'string' && value) links.push({ label, href, helper: `${key}: ${shortId(value)}` });
}

function addMetadataListLink(links: { label: string; href: string; helper?: string }[], key: string, value: unknown, href: string, label: string) {
  if (!Array.isArray(value) || value.length === 0) return;
  links.push({ label, href, helper: `${key}: ${value.slice(0, 3).map((item) => shortId(String(item))).join(', ')}${value.length > 3 ? ` +${value.length - 3}` : ''}` });
}

function shortId(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

function dedupe(links: { label: string; href: string; helper?: string }[]) {
  const seen = new Set<string>();
  return links.filter((link) => { const key = `${link.label}:${link.href}:${link.helper ?? ''}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
