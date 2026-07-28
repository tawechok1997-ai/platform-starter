'use client';

import { useId, useState, type ReactNode } from 'react';
import styles from './admin-technical-details.module.css';

type AdminTechnicalDetailsProps = {
  summary: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function AdminTechnicalDetails({ summary, children, defaultOpen = false }: AdminTechnicalDetailsProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className={styles.root} data-open={open ? 'true' : 'false'}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{summary}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>
      <div
        id={contentId}
        className={styles.content}
        role="region"
        aria-label={summary}
        aria-hidden={!open}
      >
        <div className={styles.inner}>{children}</div>
      </div>
    </section>
  );
}
