import { mapAdminKycCase, mapKycCase, mapKycDocument } from './kyc.mapper';

describe('kyc mapper', () => {
  it('maps case versions and member fields without exposing raw column names', () => {
    const row = {
      id: 'case-1',
      member_id: 'member-1',
      status: 'SUBMITTED',
      risk_level: 'MEDIUM',
      version: '3',
      username: 'member',
      phone: '0800000000',
      email: 'member@example.com',
      document_count: '2',
    };

    expect(mapKycCase(row)).toMatchObject({
      id: 'case-1',
      memberId: 'member-1',
      status: 'SUBMITTED',
      version: 3,
    });
    expect(mapAdminKycCase(row)).toMatchObject({
      member: { username: 'member', phone: '0800000000', email: 'member@example.com' },
      documentCount: 2,
    });
  });

  it('normalizes document numeric fields', () => {
    expect(
      mapKycDocument({
        id: 'doc-1',
        case_id: 'case-1',
        member_id: 'member-1',
        document_type: 'SELFIE',
        status: 'UPLOADED',
        size_bytes: '2048',
        version: '4',
      }),
    ).toMatchObject({
      id: 'doc-1',
      caseId: 'case-1',
      memberId: 'member-1',
      documentType: 'SELFIE',
      sizeBytes: 2048,
      version: 4,
    });
  });
});
