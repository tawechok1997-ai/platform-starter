import {
  DEFAULT_CHANNELS,
  channelSettingKey,
  money,
  normalizeChannels,
  statusLabel,
  topUpTitle,
  withdrawalTitle,
} from './notification.mapper';

describe('notification mapper', () => {
  it('normalizes missing and partial channel settings', () => {
    expect(normalizeChannels(null)).toEqual(DEFAULT_CHANNELS);
    expect(normalizeChannels({ email: false, sms: true })).toEqual({
      email: false,
      sms: true,
      push: true,
    });
  });

  it('builds a user-scoped channel setting key', () => {
    expect(channelSettingKey('member-1')).toBe('member.notification.channels.member-1');
  });

  it('maps statuses and transaction titles without changing API wording', () => {
    expect(statusLabel('APPROVED')).toBe('อนุมัติแล้ว');
    expect(statusLabel('UNKNOWN')).toBe('UNKNOWN');
    expect(topUpTitle('REJECTED')).toBe('รายการฝากไม่ผ่าน');
    expect(withdrawalTitle('COMPLETED')).toBe('ถอนเงินสำเร็จ');
  });

  it('formats invalid monetary values as zero instead of NaN', () => {
    expect(money('not-a-number', 'THB')).not.toContain('NaN');
  });
});
