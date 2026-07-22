'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MemberRuntimeImage } from '../member-runtime-image';

export type PromotionCarouselItem = {
  id: string;
  title: string;
  imageUrl: string;
  href?: string;
  alt?: string;
};

type PromotionCarouselProps = {
  items: PromotionCarouselItem[];
  autoPlayMs?: number;
  className?: string;
  ariaLabel?: string;
};

export function PromotionCarousel({
  items,
  autoPlayMs = 5000,
  className = '',
  ariaLabel = 'โปรโมชั่นแนะนำ',
}: PromotionCarouselProps) {
  const normalizedItems = useMemo(() => items.filter((item) => item.id && item.imageUrl), [items]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  const count = normalizedItems.length;
  const safeIndex = count ? ((activeIndex % count) + count) % count : 0;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const goTo = useCallback((nextIndex: number) => {
    if (!count) return;
    setActiveIndex(((nextIndex % count) + count) % count);
  }, [count]);

  const next = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);
  const previous = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);

  useEffect(() => {
    stopTimer();
    if (paused || count < 2 || autoPlayMs < 1000 || document.hidden) return;

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      next();
    }, autoPlayMs);

    return stopTimer;
  }, [autoPlayMs, count, next, paused, stopTimer]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) stopTimer();
      setPaused(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [stopTimer]);

  if (!count) return null;

  return (
    <section
      className={`promotion-carousel ${className}`.trim()}
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
    >
      <div className="promotion-carousel__viewport">
        {normalizedItems.map((item, index) => {
          const active = index === safeIndex;
          const content = <MemberRuntimeImage src={item.imageUrl} alt={item.alt || item.title} />;
          return (
            <article
              key={item.id}
              className={`promotion-carousel__slide${active ? ' is-active' : ''}`}
              aria-hidden={!active}
              inert={!active ? true : undefined}
              data-slide-index={index}
            >
              {item.href ? <a href={item.href} tabIndex={active ? 0 : -1}>{content}</a> : content}
            </article>
          );
        })}
      </div>

      {count > 1 && <>
        <button type="button" className="promotion-carousel__control promotion-carousel__control--previous" onClick={previous} aria-label="โปรโมชั่นก่อนหน้า">‹</button>
        <button type="button" className="promotion-carousel__control promotion-carousel__control--next" onClick={next} aria-label="โปรโมชั่นถัดไป">›</button>
        <div className="promotion-carousel__dots" role="tablist" aria-label="เลือกโปรโมชั่น">
          {normalizedItems.map((item, index) => <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === safeIndex}
            aria-label={`โปรโมชั่น ${index + 1}: ${item.title}`}
            onClick={() => goTo(index)}
          />)}
        </div>
      </>}
    </section>
  );
}
