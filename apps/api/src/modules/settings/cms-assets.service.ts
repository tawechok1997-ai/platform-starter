import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import type { AdminActor } from '../../common/actors';
import { buildAdminAuditData } from '../../common/audit/admin-audit.builder';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { RequestMeta } from './settings.service';
import type { UploadCmsAssetDto } from './cms-assets.dto';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const CMS_CONTENT_KEY = 'features.cms_content';
const PROMOTION_CAMPAIGNS_KEY = 'features.promotion_campaigns';

const MIME_RULES: Record<string, { ext: string; type: 'image' | 'video'; maxBytes: number; magic: (buffer: Buffer) => boolean }> = {
  'image/jpeg': { ext: 'jpg', type: 'image', maxBytes: MAX_IMAGE_BYTES, magic: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', type: 'image', maxBytes: MAX_IMAGE_BYTES, magic: (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: 'webp', type: 'image', maxBytes: MAX_IMAGE_BYTES, magic: (b) => b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  'image/gif': { ext: 'gif', type: 'image', maxBytes: MAX_IMAGE_BYTES, magic: (b) => b.length >= 6 && ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii')) },
  'video/mp4': { ext: 'mp4', type: 'video', maxBytes: MAX_VIDEO_BYTES, magic: (b) => b.length >= 12 && b.subarray(4, 8).toString('ascii') === 'ftyp' },
  'video/webm': { ext: 'webm', type: 'video', maxBytes: MAX_VIDEO_BYTES, magic: (b) => b.length >= 4 && b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
};

type StoredCmsAsset = {
  id?: string;
  name?: string;
  tag?: string;
  type?: string;
  enabled?: boolean;
  url?: string;
  storageKey?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
  source?: string;
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

    const sha256 = createHash('sha256').update(parsed.data).digest('hex');
    const existing = await this.findAssetBySha256(sha256);
    if (existing?.id && existing.url) {
      await this.prisma.adminAuditLog.create({
        data: buildAdminAuditData({
          adminUserId: actor.id,
          action: 'cms.asset.reuse',
          module: 'settings',
          targetId: existing.id,
          newData: { sha256, storageKey: existing.storageKey ?? null, requestedName: dto.name },
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        }),
      });
      return { ...existing, deduplicated: true };
    }

    const id = randomUUID();
    const storageKey = `cms/${id}.${rule.ext}`;
    await this.storage.put(storageKey, parsed.data, parsed.mimeType);

    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
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
      }),
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
      deduplicated: false,
    };
  }

  async remove(storageKey: string, actor: AdminActor, meta: RequestMeta) {
    const fileName = this.assertCmsStorageKey(storageKey);
    const snapshot = await this.readMediaSettings();
    const asset = snapshot.assets.find((item) => item.storageKey === storageKey);
    const publicUrl = `/public/cms-assets/${fileName}`;
    const usage = this.findUsage(snapshot.cms, snapshot.promotions, asset?.id, publicUrl);
    if (usage.length) {
      throw new BadRequestException(`CMS asset is still in use: ${usage.join(', ')}`);
    }

    await this.storage.remove(storageKey);

    await this.prisma.adminAuditLog.create({
      data: buildAdminAuditData({
        adminUserId: actor.id,
        action: 'cms.asset.delete',
        module: 'settings',
        targetId: asset?.id ?? fileName,
        oldData: { storageKey, assetId: asset?.id ?? null, sha256: asset?.sha256 ?? null },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      }),
    });

    return { success: true, storageKey, assetId: asset?.id ?? null };
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

  private async findAssetBySha256(sha256: string): Promise<StoredCmsAsset | undefined> {
    const snapshot = await this.readMediaSettings();
    return snapshot.assets.find((asset) => asset.sha256 === sha256 && typeof asset.url === 'string' && asset.url.length > 0);
  }

  private async readMediaSettings() {
    const settings = await this.prisma.siteSetting.findMany({
      where: { key: { in: [CMS_CONTENT_KEY, PROMOTION_CAMPAIGNS_KEY] } },
      select: { key: true, valueJson: true },
    });
    const cms = settings.find((item) => item.key === CMS_CONTENT_KEY)?.valueJson;
    const promotions = settings.find((item) => item.key === PROMOTION_CAMPAIGNS_KEY)?.valueJson;
    const cmsRecord = this.asRecord(cms);
    const assets = Array.isArray(cmsRecord.assets)
      ? cmsRecord.assets.map((item) => this.asRecord(item) as StoredCmsAsset)
      : [];
    return { cms, promotions, assets };
  }

  private findUsage(cms: unknown, promotions: unknown, assetId?: string, publicUrl?: string) {
    const usage: string[] = [];
    const cmsRecord = this.asRecord(cms);
    const matches = (item: Record<string, unknown>) => {
      const ids = [item.assetId, item.desktopAssetId, item.mobileAssetId];
      const urls = [item.imageUrl, item.desktopImageUrl, item.mobileImageUrl, item.iconUrl];
      return Boolean(assetId && ids.includes(assetId)) || Boolean(publicUrl && urls.includes(publicUrl));
    };

    if (Array.isArray(cmsRecord.banners)) {
      cmsRecord.banners.forEach((item, index) => { if (matches(this.asRecord(item))) usage.push(`Banner ${index + 1}`); });
    }
    if (matches(this.asRecord(cmsRecord.popup))) usage.push('Popup');
    if (Array.isArray(cmsRecord.announcements)) {
      cmsRecord.announcements.forEach((item, index) => { if (matches(this.asRecord(item))) usage.push(`Announcement ${index + 1}`); });
    }
    if (Array.isArray(promotions)) {
      promotions.forEach((item, index) => { if (matches(this.asRecord(item))) usage.push(`Promotion ${index + 1}`); });
    }
    return usage;
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

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  }
}
