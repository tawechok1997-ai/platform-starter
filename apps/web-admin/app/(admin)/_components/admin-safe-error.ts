export type AdminErrorLocale = 'th' | 'en';

type AdminErrorOptions = {
  status?: number | undefined;
  locale?: AdminErrorLocale | undefined;
};

const UNSAFE_ERROR_PATTERNS = [
  /\b(?:error|exception|stack|traceback|syntaxerror|typeerror|referenceerror)\b/i,
  /\b(?:prisma|postgres|postgresql|mysql|mongodb|redis|database|sqlstate)\b/i,
  /\b(?:select|insert|update|delete|alter|drop)\s+(?:from|into|table|database|schema)\b/i,
  /\b(?:authorization|bearer|access[_ -]?token|refresh[_ -]?token|api[_ -]?key|secret|password|credential)\b/i,
  /(?:node_modules|webpack|next\/dist|\.tsx?:\d+|\.mjs:\d+|\.js:\d+)/i,
  /(?:\/app\/|\/workspace\/|\/home\/|[a-z]:\\)/i,
  /(?:\{[\s\S]{120,}\}|\[[\s\S]{120,}\])/,
];

const CODE_MESSAGES = {
  FORBIDDEN: { th: 'คุณไม่มีสิทธิ์ทำรายการนี้', en: 'You do not have permission to perform this action.' },
  UNAUTHORIZED: { th: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', en: 'Your session has expired. Sign in again.' },
  VALIDATION_ERROR: { th: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง', en: 'Some information is invalid. Check it and try again.' },
  NOT_FOUND: { th: 'ไม่พบข้อมูลที่ต้องการ', en: 'The requested record was not found.' },
  CONFLICT: { th: 'ข้อมูลถูกเปลี่ยนแปลงแล้ว กรุณารีเฟรชและลองใหม่', en: 'The record has changed. Refresh and try again.' },
  RATE_LIMITED: { th: 'ทำรายการถี่เกินไป กรุณารอสักครู่', en: 'Too many requests. Wait a moment and try again.' },
} satisfies Record<string, Record<AdminErrorLocale, string>>;

export function safeAdminErrorMessage(
  payload: unknown,
  fallback: string,
  options: AdminErrorOptions = {},
) {
  const locale = options.locale ?? 'th';
  const code = extractCode(payload);
  const codeMessage = code ? CODE_MESSAGES[code as keyof typeof CODE_MESSAGES] : undefined;
  if (codeMessage) return codeMessage[locale];

  const candidate = extractMessage(payload);
  if (candidate && isSafeBusinessMessage(candidate)) return candidate;

  return statusMessage(options.status, locale) ?? fallback;
}

export function safeAdminCaughtError(fallback: string) {
  return fallback;
}

function extractCode(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return '';
  const value = (payload as Record<string, unknown>).code;
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function extractMessage(payload: unknown) {
  if (typeof payload === 'string') return payload.trim();
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return '';
  const value = (payload as Record<string, unknown>).message;
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    const safeParts = value.filter((entry): entry is string => typeof entry === 'string').map((entry) => entry.trim()).filter(Boolean);
    return safeParts.length ? safeParts.join(' • ') : '';
  }
  return '';
}

function isSafeBusinessMessage(value: string) {
  if (!value || value.length > 240) return false;
  if (value.includes('\n') || value.includes('\r') || value.includes('\t')) return false;
  if (value.includes('<') || value.includes('>')) return false;
  return !UNSAFE_ERROR_PATTERNS.some((pattern) => pattern.test(value));
}

function statusMessage(status: number | undefined, locale: AdminErrorLocale) {
  if (!status) return '';
  if (status === 400 || status === 422) return locale === 'th' ? 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' : 'Some information is invalid. Check it and try again.';
  if (status === 401) return CODE_MESSAGES.UNAUTHORIZED[locale];
  if (status === 403) return CODE_MESSAGES.FORBIDDEN[locale];
  if (status === 404) return CODE_MESSAGES.NOT_FOUND[locale];
  if (status === 409) return CODE_MESSAGES.CONFLICT[locale];
  if (status === 429) return CODE_MESSAGES.RATE_LIMITED[locale];
  if (status >= 500) return locale === 'th' ? 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่' : 'The service is temporarily unavailable. Try again.';
  return '';
}
