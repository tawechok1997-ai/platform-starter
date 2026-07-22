type ErrorPayload = { code?: unknown; ok?: unknown; success?: unknown };

export function safeAdminError(status: number, payload: string) {
  const upstream = readErrorPayload(payload);
  const code = safeErrorCode(upstream?.code);
  const message = status === 400 || status === 422
    ? 'ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่'
    : status === 401
      ? 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'
      : status === 403
        ? 'คุณไม่มีสิทธิ์ดำเนินการนี้'
        : status === 404
          ? 'ไม่พบข้อมูลที่ต้องการ'
          : status === 409
            ? 'ข้อมูลนี้ถูกเปลี่ยนแปลงแล้ว กรุณารีเฟรชและลองใหม่'
            : status >= 500
              ? 'ระบบขัดข้องชั่วคราว กรุณาลองใหม่ภายหลัง'
              : 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่';
  return { message, ...(code ? { code } : {}) };
}

/** Prevent an upstream API that returns HTTP 200 with `{ ok: false }` from leaking its message. */
export function safeLogicalAdminError(payload: string) {
  const upstream = readErrorPayload(payload);
  if (!upstream || (upstream.ok !== false && upstream.success !== false)) return payload;
  const code = safeErrorCode(upstream.code);
  return JSON.stringify({
    ...(upstream.ok === false ? { ok: false } : {}),
    ...(upstream.success === false ? { success: false } : {}),
    message: 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่',
    ...(code ? { code } : {}),
  });
}

function safeErrorCode(value: unknown) {
  return typeof value === 'string' && /^([A-Z0-9_]{3,80})$/.test(value) ? value : undefined;
}

function readErrorPayload(payload: string): ErrorPayload | null {
  try {
    const value = JSON.parse(payload) as unknown;
    return value && typeof value === 'object' ? value as ErrorPayload : null;
  } catch {
    return null;
  }
}
