'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function AdminField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="admin-ui-field"><span className="admin-ui-field__label">{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`admin-ui-input ${props.className ?? ''}`.trim()} />;
}

export function AdminSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`admin-ui-select ${props.className ?? ''}`.trim()} />;
}

export function AdminTable({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`admin-ui-table-wrap ${className}`.trim()}><table className="admin-ui-table">{children}</table></div>;
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return <div className="admin-ui-empty"><strong>{title}</strong><span>{description}</span></div>;
}
