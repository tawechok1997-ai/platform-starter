'use client';

import { useEffect } from 'react';
import { useSiteSettings } from '../site-settings-provider';

const DEFAULT_FAVICON_URL = '/icon.svg';
const RUNTIME_FAVICON_SELECTOR = 'link[data-site-favicon-runtime="true"]';

export default function SiteFaviconRuntime() {
  const { typedSettings } = useSiteSettings();
  const configuredUrl = normalizeFaviconUrl(typedSettings.branding.favicon_url);
  const faviconUrl = configuredUrl || DEFAULT_FAVICON_URL;

  useEffect(() => {
    const link = getOrCreateRuntimeFavicon();
    link.href = faviconUrl;

    const mimeType = faviconMimeType(faviconUrl);
    if (mimeType) link.type = mimeType;
    else link.removeAttribute('type');
  }, [faviconUrl]);

  return null;
}

function getOrCreateRuntimeFavicon() {
  const existing = document.head.querySelector<HTMLLinkElement>(RUNTIME_FAVICON_SELECTOR);
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = 'icon';
  link.dataset.siteFaviconRuntime = 'true';
  document.head.appendChild(link);
  return link;
}

function normalizeFaviconUrl(value: string | undefined) {
  const url = value?.trim() ?? '';
  if (!url) return '';
  if (url.startsWith('/') || /^https?:\/\//i.test(url) || /^data:image\//i.test(url)) return url;
  return '';
}

function faviconMimeType(url: string) {
  const pathname = url.split(/[?#]/, 1)[0]?.toLowerCase() ?? '';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.ico')) return 'image/x-icon';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.gif')) return 'image/gif';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  return '';
}
