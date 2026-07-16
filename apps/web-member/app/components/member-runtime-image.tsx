import Image from 'next/image';
import type { CSSProperties } from 'react';

type MemberRuntimeImageProps = {
  src: string;
  alt: string;
  className?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  priority?: boolean | undefined;
  sizes?: string | undefined;
  style?: CSSProperties | undefined;
};

/**
 * Runtime-managed images may come from CMS or provider URLs that are not known
 * at build time. Keep them on Next's image component for consistent sizing and
 * accessibility, but disable optimization until the host is explicitly allowed.
 */
export function MemberRuntimeImage({
  src,
  alt,
  className,
  width = 64,
  height = 64,
  priority = false,
  sizes,
  style,
}: MemberRuntimeImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      priority={priority}
      sizes={sizes}
      style={style}
      unoptimized
    />
  );
}
