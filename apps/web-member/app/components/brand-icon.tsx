import type { CSSProperties } from 'react';
import type { SiteIconSettings } from '../site-settings';
import {
  isSafeBrandIconValue,
  resolveBrandIcon,
  type ExtendedBrandIconKey,
  type ExtendedBrandIconSettings,
} from '../brand/brand-icon-registry';

type BrandIconProps = {
  name: ExtendedBrandIconKey;
  configured?: ExtendedBrandIconSettings;
  existing: SiteIconSettings;
  className?: string;
  title?: string;
  style?: CSSProperties;
};

/** Safe bridge for configurable text/emoji or image URL icons. */
export function BrandIcon({ name, configured = {}, existing, className = '', title, style }: BrandIconProps) {
  const raw = resolveBrandIcon(name, configured, existing);
  const value = isSafeBrandIconValue(raw) ? raw.trim() : '';
  const isImage = value.startsWith('/') || /^https?:\/\//i.test(value);

  if (isImage) {
    return (
      // Runtime brand icons may come from an administrator-configured external URL.
      <img
        src={value}
        alt={title || ''}
        aria-hidden={title ? undefined : true}
        className={`brand-icon brand-icon--image ${className}`.trim()}
        style={style}
      />
    );
  }

  return <span
    className={`brand-icon brand-icon--text ${className}`.trim()}
    role={title ? 'img' : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
    style={style}
  >{value}</span>;
}
