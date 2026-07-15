import fs from 'node:fs';

const routePath = 'apps/web-member/app/support/page.tsx';
const clientPath = 'apps/web-member/app/support/support-page-client.tsx';
const cardPath = 'apps/web-member/src/features/support/support-ticket-card.tsx';
const entryPath = 'apps/web-member/src/features/support/index.ts';
const failures = [];
const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';

const route = read(routePath);
const client = read(clientPath);
const card = read(cardPath);
const entry = read(entryPath);

if (!fs.existsSync(clientPath)) failures.push('missing support page client implementation');
if (!fs.existsSync(cardPath)) failures.push('missing support ticket card component');
if (!route.includes("from './support-page-client'")) failures.push('support route must delegate to support-page-client');
if (route.includes('memberApiFetch(') || route.includes('useState(')) failures.push('support route must remain thin');
if (!client.includes("from '../../src/features/support'")) failures.push('support page must import ticket card through public boundary');
if (!client.includes('<SupportTicketCard')) failures.push('support page must delegate ticket thread rendering');
if (client.includes('className="member-support-thread"')) failures.push('support thread markup must not remain inline in page client');
if (card.includes('memberApiFetch(') || card.includes('useEffect(')) failures.push('support ticket card must remain presentation-only');
if (!entry.includes('SupportTicketCard') || !entry.includes("from './support-ticket-card'")) failures.push('support public boundary must export SupportTicketCard');

if (failures.length) {
  console.error('R-012 support boundary audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('R-012 support boundary audit passed.');
