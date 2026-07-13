'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminButton, AdminNotice, AdminStack } from '../_components/admin-ui';

export type UploadedCmsAsset = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  tag?: string;
  enabled: boolean;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  source: 'upload';
};

type Props = {
  onUploaded: (asset: UploadedCmsAsset) => void;
};

const IMAGE_LIMIT = 8 * 1024 * 1024;
const VIDEO_LIMIT = 25 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);

export default function CmsAssetUploader({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('banner');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setMessage('');
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ALLOWED.has(selected.type)) {
      setMessage('รองรับเฉพาะ JPEG, PNG, WebP, GIF, MP4 และ WebM');
      event.target.value = '';
      return;
    }
    const limit = selected.type.startsWith('video/') ? VIDEO_LIMIT : IMAGE_LIMIT;
    if (selected.size > limit) {
      setMessage(`ไฟล์ใหญ่เกินกำหนด ${Math.floor(limit / 1024 / 1024)} MB`);
      event.target.value = '';
      return;
    }
    setFile(selected);
    setName(selected.name.replace(/\.[^.]+$/, '').slice(0, 180));
  }

  async function upload() {
    if (!file || !name.trim()) {
      setMessage('กรุณาเลือกไฟล์และระบุชื่อ asset');
      return;
    }
    setUploading(true);
    setMessage('กำลังอัปโหลดและตรวจลายเซ็นไฟล์...');
    try {
      const dataUrl = await readAsDataUrl(file);
      const response = await adminApiFetch('/admin/settings/cms-assets', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          tag: tag.trim(),
          type: file.type.startsWith('video/') ? 'video' : 'image',
          dataUrl,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? 'อัปโหลด asset ไม่สำเร็จ');
      onUploaded(data as UploadedCmsAsset);
      setMessage('อัปโหลดสำเร็จ เพิ่ม asset เข้า library แล้ว กรุณากดบันทึก CMS');
      setFile(null);
      setName('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'อัปโหลด asset ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  return <AdminStack>
    <label style={fieldStyle}>
      <span>ไฟล์รูปหรือวิดีโอ</span>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={chooseFile} />
      <small style={helperStyle}>รูปไม่เกิน 8 MB · วิดีโอไม่เกิน 25 MB</small>
    </label>
    <label style={fieldStyle}>
      <span>ชื่อ Asset</span>
      <input value={name} maxLength={180} onChange={(event) => setName(event.target.value)} style={inputStyle} />
    </label>
    <label style={fieldStyle}>
      <span>Tag</span>
      <input value={tag} maxLength={64} onChange={(event) => setTag(event.target.value)} style={inputStyle} />
    </label>
    {file && <div style={previewStyle}>
      {file.type.startsWith('video/')
        ? <video src={previewUrl} controls muted style={mediaStyle} />
        : <img src={previewUrl} alt="ตัวอย่าง asset" style={mediaStyle} />}
      <strong>{file.name}</strong>
      <span style={helperStyle}>{file.type} · {formatBytes(file.size)}</span>
    </div>}
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminButton onClick={upload} disabled={!file || uploading}>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเข้า Asset Library'}</AdminButton>
  </AdminStack>;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const fieldStyle = { display: 'grid', gap: 6, fontWeight: 800 } as const;
const inputStyle = { minHeight: 42, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0 } as const;
const helperStyle = { color: '#94a3b8', fontSize: 12 } as const;
const previewStyle = { display: 'grid', gap: 8, padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,.18)', background: 'rgba(255,255,255,.03)' } as const;
const mediaStyle = { width: '100%', maxHeight: 220, objectFit: 'contain' as const, borderRadius: 12, background: '#020617' };
