import { DomainError } from '../errors/domain-error';
import { enforceReasonAndAudit } from './reason-audit-policy';

describe('enforceReasonAndAudit', () => {
  it('normalizes and returns a required reason and audit event', () => {
    expect(enforceReasonAndAudit(
      { action: 'admin.disable', reasonRequired: true, auditEventRequired: true },
      { reason: '  ตรวจสอบ   ความเสี่ยง  ', auditEvent: 'admin.account.disabled' },
    )).toEqual({ reason: 'ตรวจสอบ ความเสี่ยง', auditEvent: 'admin.account.disabled' });
  });

  it.each([
    [{ action: 'admin.disable', reasonRequired: true }, {}, 'AUTH_REASON_REQUIRED'],
    [{ action: 'admin.disable', reasonRequired: true, minimumReasonLength: 5 }, { reason: 'no' }, 'AUTH_REASON_TOO_SHORT'],
    [{ action: 'admin.disable', maximumReasonLength: 5 }, { reason: 'long reason' }, 'AUTH_REASON_TOO_LONG'],
    [{ action: 'admin.disable', auditEventRequired: true }, { reason: 'valid', auditEvent: 'INVALID EVENT' }, 'AUTH_AUDIT_EVENT_REQUIRED'],
  ])('returns stable domain error %#', (requirement, input, code) => {
    expect(() => enforceReasonAndAudit(requirement, input)).toThrow(DomainError);
    try {
      enforceReasonAndAudit(requirement, input);
    } catch (error) {
      expect((error as DomainError).code).toBe(code);
    }
  });
});
