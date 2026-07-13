import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import type { AdminActor } from '../../common/actors';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { RequestMeta } from './settings.service';
import type { UploadCmsAssetDto } from './cms-assets.dto';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const MIME_RULES: Record<string, { ext: string; type: 'image' | 'video'; maxBytes: number; magic: (buffer: Buffer) => boolean }> = {
  'image/jpeg': { ext: 'jpg', type: 'image', maxBytes: MAX_IMAGE_BYTES, magic: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', type: 'image', maxBytes: MAX_IMAGE_BYTES, magic: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: 'webp', type: 'image', maxBytes: MAX_IMAGE_BYTES, magic: (b) => b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  'image/gif': { ext: 'gif', type: 'image', maxBytes: MAX_IMAGE_BYTES, magic: (b) => b.length >= 6 && ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii')) },
  'video/mp4': { ext: 'mp4', type: 'video', maxBytes: MAX_VIDEO_BYTES, magic: (b) => b.length >= 12 && b.subarray(4, 8).toString('ascii') === 'ftyp' },
  'video/webm': { ext: 'webm', type: 'video', maxBytes: MAX_VIDEO_BYTES, magic: (b) => b.length >= 4 && b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
};

@Injectable()
export class CmsAssetsService {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async upload(dto: UploadCmsAssetDto, actor: AdminActor, meta: RequestMeta) {
    const parsed = this.parseDataUrl(dto.dataUrl);
    const rule = MIME_RULES[parsed.mimeType];
    if (!rule) throw new BadRequestException('Unsupported CMS asset MIME type');
    if (dto.type && dto.type !== rule.type) throw new BadRequestException('Asset type does not match MIME type');
    if (parsed.data.length === 0) throw new BadRequestException('CMS asset file is empty');
    if (parsed.data.length > rule.maxBytes) throw new BadRequestException(`CMS asset exceeds ${Math.floor(rule.maxBytes / 1024 / 1024)} MB limit`);
    if (!rule.magic(parsed.data)) throw new BadRequestException('CMS asset file signature does not match MIME type');

    const id = randomUUID();
    const storageKey = `cms/${id}.${rule.ext}`;
    const sha256 = createHash('sha256').update(parsed.data).digest('hex');

    await this.storage.put(storageKey, parsed.data, parsed.mimeType);

    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId: actor.id,
        action: 'cms.asset.upload',
        module: 'settings',
        targetId: id,
        newData: {
          storageKey,
          mimeType: parsed.mimeType,
          sizeBytes: parsed.data.length,
          sha256,
          name: dto.name,
          tag: dto.tag ?? null,
        },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return {
      id,
      name: dto.name,
      tag: dto.tag ?? '',
      type: rule.type,
      enabled: true,
      url: `/public/cms-assets/${id}.${rule.ext}`,
      storageKey,
      mimeType: parsed.mimeType,
      sizeBytes: parsed.data.length,
      sha256,
      source: 'upload',
    };
  }

  async remove(storageKey: string, actor: AdminActor, meta: RequestMeta) {
    const fileName = this.assertCmsStorageKey(storageKey);
    await this.storage.remove(storageKey);

    await this.prisma.adminAuditLog.create({
      data: {
        adminUserId: actor.id,
        action: 'cms.asset.delete',
        module: 'settings',
        targetId: fileName,
        oldData: { storageKey },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return { success: true, storageKey };
  }

  async readPublic(fileName: string) {
    const storageKey = `cms/${this.assertFileName(fileName)}`;
    const contentType = this.contentTypeFromFileName(fileName);
    try {
      return await this.storage.get(storageKey, contentType);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException('CMS asset not found');
    }
  }

  private parseDataUrl(value: string) {
    const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([a-z0-9+/=\r\n]+)$/i.exec(value.trim());
    if (!match) throw new BadRequestException('CMS asset must be a valid base64 data URL');
    let data: Buffer;
    try {
      data = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    } catch {
      throw new BadRequestException('CMS asset base64 payload is invalid');
    }
    return { mimeType: match[1].toLowerCase(), data };
  }

  private assertCmsStorageKey(storageKey: string) {
    const match = /^cms\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|gif|mp4|webm))$/i.exec(storageKey);
    if (!match) throw new BadRequestException('Invalid CMS storage key');
    return match[1];
  }

  private assertFileName(fileName: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp|gif|mp4|webm)$/i.test(fileName)) {
      throw new NotFoundException('CMS asset not found');
    }
    return fileName;
  }

  private contentTypeFromFileName(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', mp4: 'video/mp4', webm: 'video/webm',
    };
    return map[ext ?? ''] ?? 'application/octet-stream';
  }
}
