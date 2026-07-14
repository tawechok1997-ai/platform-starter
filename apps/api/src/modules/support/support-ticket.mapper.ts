import { Prisma } from '@prisma/client';

export type TicketMessage = {
  by: 'member' | 'admin' | 'system';
  userId?: string;
  adminUserId?: string;
  message: string;
  createdAt: string;
};

export type TicketAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksumSha256: string;
  uploadedBy: 'member' | 'admin';
  uploadedById: string;
  createdAt: string;
  deletedAt: string | null;
  deletedById: string | null;
};

export type TicketMetadata = {
  category: string;
  sourceRefType: string | null;
  sourceRefId: string | null;
  assignedTo: string | null;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
};

type TicketRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  refId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  member?: { id: string; username: string; phone: string | null; email: string | null } | null;
};

export function parseTicketMetadata(value: unknown): TicketMetadata {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    category: typeof data.category === 'string' ? data.category : 'general',
    sourceRefType: typeof data.sourceRefType === 'string' ? data.sourceRefType : null,
    sourceRefId: typeof data.sourceRefId === 'string' ? data.sourceRefId : null,
    assignedTo: typeof data.assignedTo === 'string' ? data.assignedTo : null,
    messages: Array.isArray(data.messages) ? (data.messages as TicketMessage[]) : [],
    attachments: Array.isArray(data.attachments) ? (data.attachments as TicketAttachment[]) : [],
  };
}

export function mapPublicAttachment(attachment: TicketAttachment) {
  const { storageKey: _storageKey, deletedById: _deletedById, ...safe } = attachment;
  return safe;
}

export function mapSupportTicket(item: TicketRecord) {
  const metadata = parseTicketMetadata(item.metadata);
  return {
    id: item.id,
    subject: item.title,
    message: item.description ?? '',
    status: item.status,
    severity: item.severity,
    category: metadata.category,
    refType: metadata.sourceRefType,
    refId: metadata.sourceRefId ?? item.refId,
    assignedTo: metadata.assignedTo,
    messages: metadata.messages,
    attachments: metadata.attachments.filter((entry) => !entry.deletedAt).map(mapPublicAttachment),
    member: item.member ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    resolvedAt: item.resolvedAt,
  };
}
