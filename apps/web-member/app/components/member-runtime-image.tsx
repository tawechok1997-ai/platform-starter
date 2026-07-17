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
 * Images used by the Member lobby can come from local reference assets, CMS,
 * providers, or deployed runtime URLs. Serve them directly instead of routing
 * them through the Next.js image optimizer so Railway/static deployments do
 * not replace valid lobby artwork with broken-image placeholders.
 *
 * The component still keeps the Next Image sizing and accessibility contract,
 * while `unoptimized` makes the browser request the original asset URL.
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
      unoptimized
    />
  );
}
