/** Public boundary for the support feature. Keep private implementation files unexported. */
export const SUPPORT_FEATURE_BOUNDARY = 'support' as const;
export { SupportTicketCard, type SupportTicket } from './support-ticket-card';
