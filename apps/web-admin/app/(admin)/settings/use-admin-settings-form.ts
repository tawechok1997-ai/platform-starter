'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { useAdminUnsavedChanges } from '../_components/admin-unsaved-changes';

type SettingsFormOptions<T extends object> = {
  endpoint: string;
  defaults: T;
  loadingMessage?: string;
  enabled?: boolean;
  canSave?: boolean;
};

type SaveResult = {
  requiresDualApproval?: boolean;
  settings?: unknown;
};

export function useAdminSettingsForm<T extends object>({
  endpoint,
  defaults,
  loadingMessage = 'กำลังโหลด...',
  enabled = true,
  canSave = true,
}: SettingsFormOptions<T>) {
  const loadRequestRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const [form, setForm] = useState<T>(defaults);
  const [initialForm, setInitialForm] = useState<T>(defaults);
  const [message, setMessage] = useState(enabled ? loadingMessage : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const { isDirty, saveState } = useAdminUnsavedChanges({ value: form, savedValue: initialForm, saving });

  const load = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return false;
    }

    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setLoading(true);
    setError('');
    setMessage(loadingMessage);
    try {
      const response = await adminApiFetch(endpoint);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || !isRecord(payload.settings)) {
        const detail = isRecord(payload) && typeof payload.message === 'string' ? payload.message : '';
        throw new Error(detail || `โหลดการตั้งค่าไม่สำเร็จ (${response.status})`);
      }
      if (loadRequestRef.current !== requestId) return false;
      const settings = { ...defaults, ...payload.settings } as T;
      setForm(settings);
      setInitialForm(settings);
      setMessage('');
      return true;
    } catch (caught) {
      if (loadRequestRef.current !== requestId) return false;
      const detail = caught instanceof Error && caught.message ? caught.message : 'โหลดการตั้งค่าไม่สำเร็จ กรุณาลองใหม่';
      setError(detail);
      setMessage('');
      return false;
    } finally {
      if (loadRequestRef.current === requestId) setLoading(false);
    }
  }, [defaults, enabled, endpoint, loadingMessage]);

  useEffect(() => {
    if (!enabled) {
      loadRequestRef.current += 1;
      setLoading(false);
      setMessage('');
      return;
    }
    void load();
  }, [enabled, load]);

  const save = useCallback(async () => {
    if (!enabled || !canSave) {
      setMessage('บัญชีนี้ไม่มีสิทธิ์บันทึกการตั้งค่านี้');
      return false;
    }
    if (saveInFlightRef.current) return false;
    saveInFlightRef.current = true;
    loadRequestRef.current += 1;
    setSaving(true);
    setError('');
    setMessage('กำลังบันทึก...');
    try {
      const response = await adminApiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null) as SaveResult | null;
      if (!response.ok || (payload !== null && !isRecord(payload))) {
        const detail = payload && isRecord(payload) && typeof payload.message === 'string'
          ? payload.message
          : `บันทึกการตั้งค่าไม่สำเร็จ (${response.status})`;
        setError(detail);
        setMessage('');
        return false;
      }

      const normalized = payload && isRecord(payload.settings)
        ? { ...defaults, ...payload.settings } as T
        : form;
      setForm(normalized);
      setInitialForm(normalized);
      setLastSavedAt(new Date().toISOString());
      setMessage(payload?.requiresDualApproval
        ? 'ส่งการเปลี่ยนแปลงเข้าคิวอนุมัติแล้ว ค่ายังไม่ควรถือว่ามีผลจนกว่าจะอนุมัติครบ'
        : 'บันทึกการตั้งค่าสำเร็จ');
      return true;
    } catch (caught) {
      setError(caught instanceof Error && caught.message
        ? caught.message
        : 'เชื่อมต่อระบบบันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่');
      setMessage('');
      return false;
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  }, [canSave, defaults, enabled, endpoint, form]);

  const reset = useCallback(() => {
    if (saveInFlightRef.current) return;
    setForm(initialForm);
    setError('');
    setMessage('คืนค่าล่าสุดจากระบบแล้ว');
  }, [initialForm]);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    if (saveInFlightRef.current || !canSave) return;
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  }, [canSave]);

  return {
    form,
    initialForm,
    message,
    error,
    loading,
    saving,
    isDirty,
    saveState,
    lastSavedAt,
    setForm,
    setMessage,
    setError,
    load,
    save,
    reset,
    update,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
