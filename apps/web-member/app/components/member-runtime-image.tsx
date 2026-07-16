import Image from 'next/image';
import type { CSSProperties } from 'react';

type MemberRuntimeImageProps = {
  src: string;
  alt: string;
  className?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  fill?: boolean | undefined;
  priority?: boolean | undefined;
  sizes?: string | undefined;
  style?: CSSProperties | undefined;
};

/**
 * Runtime-managed images may come from CMS or provider URLs that are not known
 * at build time. Local assets remain optimized. Remote/runtime URLs keep the
 * Next image sizing and accessibility contract while bypassing host-bound
 * optimization until their origin is explicitly allow-listed.
 */
export function MemberRuntimeImage({
  src,
  alt,
  className,
  width = 64,
  height = 64,
  fill = false,
  priority = false,
  sizes,
  style,
}: MemberRuntimeImageProps) {
  const isLocalAsset = src.startsWith('/');
  const dimensions = fill ? {} : { width, height };

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      {...dimensions}
      fill={fill}
      priority={priority}
      sizes={sizes}
      style={style}
      unoptimized={!isLocalAsset}
    />
  );
}
