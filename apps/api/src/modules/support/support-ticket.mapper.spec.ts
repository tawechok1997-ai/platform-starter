import { mapSupportTicket, parseTicketMetadata } from './support-ticket.mapper';

describe('support ticket mapper', () => {
  it('applies safe metadata defaults', () => {
    expect(parseTicketMetadata(null)).toEqual({
      category: 'general',
      sourceRefType: null,
      sourceRefId: null,
      assignedTo: null,
      messages: [],
      attachments: [],
    });
  });

  it('hides storage keys and deleted attachments from responses', () => {
    const now = new Date('2026-07-14T00:00:00.000Z');
    const item = mapSupportTicket({
      id: 'ticket-1',
      title: 'Deposit help',
      description: 'Please review',
      status: 'OPEN',
      severity: 'MEDIUM',
      refId: 'fallback-ref',
      metadata: {
        category: 'finance',
        sourceRefType: 'TOPUP',
        sourceRefId: 'topup-1',
        assignedTo: null,
        messages: [],
        attachments: [
          {
            id: 'active',
            originalName: 'proof.png',
            mimeType: 'image/png',
            sizeBytes: 10,
            storageKey: 'support/ticket-1/proof.png',
            checksumSha256: 'abc',
            uploadedBy: 'member',
            uploadedById: 'user-1',
            createdAt: now.toISOString(),
            deletedAt: null,
            deletedById: null,
          },
          {
            id: 'deleted',
            originalName: 'old.png',
            mimeType: 'image/png',
            sizeBytes: 10,
            storageKey: 'support/ticket-1/old.png',
            checksumSha256: 'def',
            uploadedBy: 'member',
            uploadedById: 'user-1',
            createdAt: now.toISOString(),
            deletedAt: now.toISOString(),
            deletedById: 'user-1',
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    });

    expect(item.refId).toBe('topup-1');
    expect(item.attachments).toHaveLength(1);
    expect(item.attachments[0]).not.toHaveProperty('storageKey');
    expect(item.attachments[0]).not.toHaveProperty('deletedById');
  });
});
