import { Prisma } from '@prisma/client';
import { NotificationsQueryService } from './notifications-query.service';

describe('R-010 notification response contract', () => {
  it('keeps items, groups, counts, total, and preferences stable', async () => {
    const repository = {
      loadMemberFeedSources: jest.fn().mockResolvedValue([
        [{ id: 't1', amount: new Prisma.Decimal(100), currency: 'THB', status: 'APPROVED', updatedAt: new Date('2026-07-15T10:00:00.000Z') }],
        [],
        [],
        [],
      ]),
      loadMemberFeedState: jest.fn().mockResolvedValue([{ notificationKey: 'topup:t1:APPROVED', readAt: new Date('2026-07-15T11:00:00.000Z'), archivedAt: null }]),
      loadMemberPreferenceDetail: jest.fn().mockResolvedValue([null, null]),
    } as any;

    const result = await new NotificationsQueryService(repository).listMemberNotifications('user-1');

    expect(result).toMatchInlineSnapshot(`
{
  "counts": {
    "finance": 1,
  },
  "groups": {
    "2026-07-15": [
      {
        "createdAt": "2026-07-15T10:00:00.000Z",
        "description": "รายการฝาก ฿100.00 มีสถานะ อนุมัติแล้ว",
        "href": "/transactions",
        "id": "topup:t1:APPROVED",
        "isRead": true,
        "readAt": "2026-07-15T11:00:00.000Z",
        "title": "ฝากสำเร็จ",
        "type": "finance",
      },
    ],
  },
  "items": [
    {
      "createdAt": "2026-07-15T10:00:00.000Z",
      "description": "รายการฝาก ฿100.00 มีสถานะ อนุมัติแล้ว",
      "href": "/transactions",
      "id": "topup:t1:APPROVED",
      "isRead": true,
      "readAt": "2026-07-15T11:00:00.000Z",
      "title": "ฝากสำเร็จ",
      "type": "finance",
    },
  ],
  "preferences": {
    "categories": {
      "finance": true,
      "promotion": true,
      "security": true,
      "system": true,
    },
    "channels": {
      "email": true,
      "push": true,
      "sms": false,
    },
  },
  "total": 1,
}
`);
  });
});
