import type { CSSProperties } from 'react';
import { resolveBrandIcon, type BrandIconName } from '../brand/brand-icon-registry';

type BrandIconProps = {
  name: BrandIconName;
  value?: unknown;
  className?: string;
  title?: string;
  style?: CSSProperties;
};

/**
 * Consumer bridge for configurable icons. It only renders safe text/emoji or
 * same-origin/HTTP(S) image assets returned by the registry sanitizer.
 */
export function BrandIcon({ name, value, className = '', title, style }: BrandIconProps) {
  const resolved = resolveBrandIcon(name, value);
  const label = title || name;

  if (resolved.kind === 'image') {
    return <img
      src={resolved.value}
      alt={title || ''}
      aria-hidden={title ? undefined : true}
      className={`brand-icon brand-icon--image ${className}`.trim()}
      style={style}
    />;
  }

  return <span
    className={`brand-icon brand-icon--text ${className}`.trim()}
    role={title ? 'img' : undefined}
    aria-label={title ? label : undefined}
    aria-hidden={title ? undefined : true}
    style={style}
  >{resolved.value}</span>;
}
