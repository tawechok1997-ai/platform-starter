import { Injectable, NotFoundException } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { Readable } from 'stream';

type StoredObject = { data: Buffer; contentType: string };

@Injectable()
export class StorageService {
  private s3Client?: S3Client;

  async put(key: string, data: Buffer, contentType: string) {
    this.assertSafeKey(key);
    if (this.driver() === 's3') return this.putS3(key, data, contentType);
    return this.putLocal(key, data);
  }

  async get(key: string, contentType: string): Promise<StoredObject> {
    this.assertSafeKey(key);
    if (this.driver() === 's3') return this.getS3(key, contentType);
    return this.getLocal(key, contentType);
  }

  async remove(key: string) {
    this.assertSafeKey(key);
    if (this.driver() === 's3') {
      await this.client().send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }));
      return { key, deleted: true };
    }
    await rm(this.localPath(key), { force: true });
    return { key, deleted: true };
  }

  async delete(key: string) {
    return this.remove(key);
  }

  private async putLocal(key: string, data: Buffer) {
    const filePath = this.localPath(key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    return { key };
  }

  private async getLocal(key: string, contentType: string) {
    try {
      const data = await readFile(this.localPath(key));
      return { data, contentType };
    } catch {
      throw new NotFoundException('Stored file not found');
    }
  }

  private async deleteLocal(key: string) {
    await rm(this.localPath(key), { force: true });
    return { key, deleted: true };
  }

  private async putS3(key: string, data: Buffer, contentType: string) {
    await this.client().send(new PutObjectCommand({ Bucket: this.bucket(), Key: key, Body: data, ContentType: contentType }));
    return { key };
  }

  private async getS3(key: string, contentType: string) {
    try {
      const result = await this.client().send(new GetObjectCommand({ Bucket: this.bucket(), Key: key }));
      const data = await this.toBuffer(result.Body);
      return { data, contentType: result.ContentType ?? contentType };
    } catch {
      throw new NotFoundException('Stored file not found');
    }
  }

  private async deleteS3(key: string) {
    await this.client().send(new DeleteObjectCommand({ Bucket: this.bucket(), Key: key }));
    return { key, deleted: true };
  }

  private client() {
    if (!this.s3Client) {
      const endpoint = process.env.S3_ENDPOINT;
      const region = process.env.S3_REGION || 'auto';
      const accessKeyId = process.env.S3_ACCESS_KEY_ID;
      const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
      if (!endpoint || !accessKeyId || !secretAccessKey || !process.env.S3_BUCKET) throw new Error('S3 storage is not configured');
      this.s3Client = new S3Client({
        region,
        endpoint,
        forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
        credentials: { accessKeyId, secretAccessKey },
      });
    }
    return this.s3Client;
  }

  private async toBuffer(body: unknown) {
    if (body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of body) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return Buffer.concat(chunks);
    }
    if (body instanceof Uint8Array) return Buffer.from(body);
    throw new NotFoundException('Stored file body is invalid');
  }

  private driver() { return (process.env.STORAGE_DRIVER || 'local').toLowerCase(); }
  private bucket() { const value = process.env.S3_BUCKET; if (!value) throw new Error('S3_BUCKET is required'); return value; }
  private localPath(key: string) { return join(process.env.PRIVATE_MEDIA_DIR || '/tmp/platform-private-media', key); }

  private assertSafeKey(key: string) {
    if (!key || key.length > 512 || key.startsWith('/') || key.startsWith('\\') || key.includes('..') || key.includes('\\') || !/^[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(key)) {
      throw new Error('Unsafe storage key');
    }
  }
}
