'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { useAdminUnsavedChanges } from '../_components/admin-unsaved-changes';

type SettingsFormOptions<T extends object> = {
  endpoint: string;
  defaults: T;
  loadingMessage?: string;
};

type SaveResult = {
  requiresDualApproval?: boolean;
  settings?: unknown;
};

export function useAdminSettingsForm<T extends object>({
  endpoint,
  defaults,
  loadingMessage = 'กำลังโหลด...',
}: SettingsFormOptions<T>) {
  const loadRequestRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const [form, setForm] = useState<T>(defaults);
  const [initialForm, setInitialForm] = useState<T>(defaults);
  const [message, setMessage] = useState(loadingMessage);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isDirty, saveState } = useAdminUnsavedChanges({ value: form, savedValue: initialForm, saving });

  const load = useCallback(async () => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    setLoading(true);
    setMessage(loadingMessage);
    try {
      const response = await adminApiFetch(endpoint);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || !isRecord(payload.settings)) throw new Error('load');
      if (loadRequestRef.current !== requestId) return;
      const settings = { ...defaults, ...payload.settings } as T;
      setForm(settings);
      setInitialForm(settings);
      setMessage('');
    } catch {
      if (loadRequestRef.current !== requestId) return;
      setMessage('โหลดการตั้งค่าไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (loadRequestRef.current === requestId) setLoading(false);
    }
  }, [defaults, endpoint, loadingMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    if (saveInFlightRef.current) return false;
    saveInFlightRef.current = true;
    loadRequestRef.current += 1;
    setSaving(true);
    setMessage('กำลังบันทึก...');
    try {
      const response = await adminApiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null) as SaveResult | null;
      if (!response.ok || (payload !== null && !isRecord(payload))) {
        setMessage('บันทึกการตั้งค่าไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองใหม่');
        return false;
      }

      const normalized = payload && isRecord(payload.settings)
        ? { ...defaults, ...payload.settings } as T
        : form;
      setForm(normalized);
      setInitialForm(normalized);
      setMessage(payload?.requiresDualApproval
        ? 'ส่งการเปลี่ยนแปลงเข้าคิวอนุมัติแล้ว ค่ายังไม่ควรถือว่ามีผลจนกว่าจะอนุมัติครบ'
        : 'บันทึกการตั้งค่าสำเร็จ');
      return true;
    } catch {
      setMessage('เชื่อมต่อระบบบันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่');
      return false;
    } finally {
      saveInFlightRef.current = false;
      setSaving(false);
    }
  }, [defaults, endpoint, form]);

  const reset = useCallback(() => {
    if (saveInFlightRef.current) return;
    setForm(initialForm);
    setMessage('คืนค่าล่าสุดจากระบบแล้ว');
  }, [initialForm]);

  const update = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    if (saveInFlightRef.current) return;
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  return {
    form,
    initialForm,
    message,
    loading,
    saving,
    isDirty,
    saveState,
    setForm,
    setMessage,
    load,
    save,
    reset,
    update,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
