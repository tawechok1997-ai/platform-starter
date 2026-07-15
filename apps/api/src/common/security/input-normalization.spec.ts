import {
  normalizeBankAccount,
  normalizeEmail,
  normalizePhone,
  normalizeUnicodeText,
} from './input-normalization';

describe('security input normalization', () => {
  it('normalizes Unicode text and collapses whitespace', () => {
    expect(normalizeUnicodeText('  ＡＢＣ\n  ทดสอบ  ')).toBe('ABC ทดสอบ');
  });

  it('normalizes email without guessing malformed values', () => {
    expect(normalizeEmail('  USER@Example.COM ')).toBe('user@example.com');
    expect(normalizeEmail('not-an-email')).toBeNull();
  });

  it('normalizes phone separators while preserving an explicit plus prefix', () => {
    expect(normalizePhone('+66 81-234-5678')).toBe('+66812345678');
    expect(normalizePhone('123')).toBeNull();
  });

  it('normalizes bank account digits and rejects invalid lengths', () => {
    expect(normalizeBankAccount('123-4-56789-0')).toBe('1234567890');
    expect(normalizeBankAccount('12')).toBeNull();
  });

  it('removes control characters and enforces maximum length', () => {
    expect(normalizeUnicodeText('abc\u0000def', 5)).toBe('abcde');
  });
});
