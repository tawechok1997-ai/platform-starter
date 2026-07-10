'use client';

import { FormEvent, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function AdminTwoFactorPage() {
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('กำลังยืนยัน...');

    const res = await fetch(`${API_URL}/admin/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, code }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.message ?? 'ยืนยันไม่สำเร็จ');
      return;
    }

    window.localStorage.setItem('admin_access_token', data.accessToken);
    window.localStorage.setItem('admin_refresh_token', data.refreshToken);
    setMessage('ยืนยันสำเร็จ');
  }

  return (
    <main style={{ maxWidth: 420, margin: '48px auto', padding: 24 }}>
      <h1>Admin 2FA</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input value={challengeId} onChange={(e) => setChallengeId(e.target.value)} placeholder="Challenge ID" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" />
        <button type="submit">Verify</button>
      </form>
      {message && <p>{message}</p>}
    </main>
  );
}
