import { Controller, Get, Param, Res } from '@nestjs/common';
import { StorageSignedAccessService } from './storage-signed-access.service';
import { StorageService } from './storage.service';

type BinaryResponse = {
  type(contentType: string): BinaryResponse;
  setHeader(name: string, value: string): BinaryResponse;
  send(data: Buffer): unknown;
};

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storage: StorageService,
    private readonly signedAccess: StorageSignedAccessService,
  ) {}

  @Get('signed/:token')
  async readSigned(@Param('token') token: string, @Res() response: BinaryResponse) {
    const payload = this.signedAccess.verify(token);
    const stored = await this.storage.get(payload.key, payload.contentType);
    response.setHeader('Cache-Control', 'private, no-store, max-age=0');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (payload.fileName) {
      const safeName = payload.fileName.replace(/[\r\n"\\]/g, '_').slice(0, 180);
      response.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    }
    return response.type(stored.contentType).send(stored.data);
  }
}
