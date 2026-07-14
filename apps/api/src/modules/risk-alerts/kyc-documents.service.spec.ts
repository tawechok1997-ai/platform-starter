import { KycDocumentsService } from './kyc-documents.service';

describe('KycDocumentsService facade', () => {
  function setup() {
    const queries = { memberCase: jest.fn(), adminList: jest.fn(), adminGet: jest.fn() };
    const memberCommands = { upload: jest.fn(), submit: jest.fn() };
    const reviews = { reviewDocument: jest.fn(), reviewCase: jest.fn() };
    const access = { issueAccessToken: jest.fn(), downloadWithToken: jest.fn() };
    const retention = { cleanupExpired: jest.fn() };
    return {
      instance: new KycDocumentsService(
        queries as never,
        memberCommands as never,
        reviews as never,
        access as never,
        retention as never,
      ),
      queries,
      memberCommands,
      reviews,
      access,
      retention,
    };
  }

  it('delegates member uploads to the member command service', async () => {
    const { instance, memberCommands } = setup();
    const input = { documentType: 'SELFIE', originalName: 'selfie.png', dataUrl: 'data:image/png;base64,aGVsbG8=' };
    memberCommands.upload.mockResolvedValue({ item: { id: 'doc-1' } });

    await expect(instance.upload('member-1', input as never)).resolves.toEqual({ item: { id: 'doc-1' } });
    expect(memberCommands.upload).toHaveBeenCalledWith('member-1', input);
  });

  it('delegates reviews to the review command service', async () => {
    const { instance, reviews } = setup();
    const input = { status: 'ACCEPTED', version: 1 };
    reviews.reviewDocument.mockResolvedValue({ item: { id: 'doc-1' } });

    await expect(instance.reviewDocument('doc-1', input as never, 'admin-1')).resolves.toEqual({ item: { id: 'doc-1' } });
    expect(reviews.reviewDocument).toHaveBeenCalledWith('doc-1', input, 'admin-1');
  });

  it('delegates private access token operations', async () => {
    const { instance, access } = setup();
    access.issueAccessToken.mockReturnValue({ token: 'token-1' });

    expect(instance.issueAccessToken('doc-1', 'admin-1')).toEqual({ token: 'token-1' });
    expect(access.issueAccessToken).toHaveBeenCalledWith('doc-1', 'admin-1');
  });
});
