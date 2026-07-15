import { BadRequestException } from '@nestjs/common';
import { validateStoredUpload } from './storage-upload-policy';

describe('validateStoredUpload', () => {
  const previousMax = process.env.STORAGE_MAX_UPLOAD_BYTES;

  afterEach(() => {
    if (previousMax === undefined) delete process.env.STORAGE_MAX_UPLOAD_BYTES;
    else process.env.STORAGE_MAX_UPLOAD_BYTES = previousMax;
  });

  it('accepts a valid PNG signature', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(() => validateStoredUpload(png, 'image/png')).not.toThrow();
  });

  it('rejects empty files', () => {
    expect(() => validateStoredUpload(Buffer.alloc(0), 'image/png')).toThrow(BadRequestException);
  });

  it('rejects files above the configured global limit', () => {
    process.env.STORAGE_MAX_UPLOAD_BYTES = '4';
    expect(() => validateStoredUpload(Buffer.from('12345'), 'text/plain')).toThrow(/exceeds 4 byte limit/);
  });

  it('rejects blocked executable content types', () => {
    expect(() => validateStoredUpload(Buffer.from('echo pwned'), 'application/x-sh')).toThrow(/MIME type is not allowed/);
  });

  it('rejects a MIME and signature mismatch', () => {
    expect(() => validateStoredUpload(Buffer.from('not a png'), 'image/png')).toThrow(/signature does not match/);
  });

  it('rejects active content inside SVG files', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    expect(() => validateStoredUpload(svg, 'image/svg+xml')).toThrow(/unsafe active content/);
  });

  it('accepts passive SVG content', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" /></svg>');
    expect(() => validateStoredUpload(svg, 'image/svg+xml')).not.toThrow();
  });
});
