import { MemberRiskEnforcementService } from './member-risk-enforcement.service';

describe('MemberRiskEnforcementService', () => {
  it('checks registration contact, bank, IP, and device subjects', async () => {
    const risk = { enforce: jest.fn().mockResolvedValue({ matched: false, blocked: false, items: [] }) };
    const service = new MemberRiskEnforcementService(risk as any);

    await service.enforceRegistration({
      username: 'member01',
      phone: '0812345678',
      email: 'Member@Example.com',
      bankAccountNumber: '123-4-56789-0',
      bankAccountName: 'Member One',
      bankName: 'Test Bank',
      fullName: 'Member One',
      secret: 'secret123',
      deviceId: 'ios-device',
    } as any, '203.0.113.10', 'ios-device');

    expect(risk.enforce).toHaveBeenCalledWith(expect.objectContaining({
      context: 'MEMBER_REGISTRATION',
      referenceType: 'member_registration',
      referenceId: 'member01',
      actorId: undefined,
      subjects: expect.arrayContaining([
        { subjectType: 'PHONE', subjectValue: '0812345678' },
        { subjectType: 'EMAIL', subjectValue: 'Member@Example.com' },
        { subjectType: 'BANK_ACCOUNT', subjectValue: '123-4-56789-0' },
        { subjectType: 'IP', subjectValue: '203.0.113.10' },
        { subjectType: 'DEVICE', subjectValue: 'ios-device' },
      ]),
    }));
  });

  it('checks member identity before profile contact changes', async () => {
    const risk = { enforce: jest.fn().mockResolvedValue({ matched: false, blocked: false, items: [] }) };
    const service = new MemberRiskEnforcementService(risk as any);

    await service.enforceProfileUpdate('member-1', {
      phone: '0899999999',
      email: 'new@example.com',
      displayName: 'Member One',
    } as any);

    expect(risk.enforce).toHaveBeenCalledWith(expect.objectContaining({
      context: 'MEMBER_PROFILE_UPDATE',
      memberId: 'member-1',
      referenceType: 'user',
      referenceId: 'member-1',
      subjects: expect.arrayContaining([
        { subjectType: 'MEMBER', subjectValue: 'member-1' },
        { subjectType: 'PHONE', subjectValue: '0899999999' },
        { subjectType: 'EMAIL', subjectValue: 'new@example.com' },
      ]),
    }));
  });
});
