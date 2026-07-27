'use client';

import { useEffect } from 'react';
import MemberGuideOverlay from './member-guide-overlay';
import MemberLanguageOverlay from './member-language-overlay';
import MemberSearchOverlay from './member-search-overlay';

type DragState = {
  rail: HTMLElement;
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
};

type HomeGuideItem = {
  question: string;
  answer: string;
};

const DRAG_THRESHOLD_PX = 5;
const SOURCE_DRAG_MULTIPLIER = 2;
const GUIDE_SELECTOR = ".reference-guide[data-section-kind='guide']";

const HOME_GUIDE_ITEMS: HomeGuideItem[] = [
  {
    question: 'ฝากเงินแบบ โอนผ่านธนาคาร',
    answer: 'เลือกเมนูฝาก เลือกธนาคารที่ต้องการ จากนั้นกรอกยอดและทำรายการตามขั้นตอนที่ระบบแสดง',
  },
  {
    question: 'ฝากเงินแบบ โอนผ่าน QR Payment',
    answer: 'เลือกฝากผ่าน QR ระบุยอดเงิน แล้วสแกน QR ที่ระบบสร้างให้ภายในเวลาที่กำหนด',
  },
  {
    question: 'ฝากเงินแบบ ฝากจุดทศนิยม',
    answer: 'กรอกยอดตามที่ระบบกำหนดและโอนยอดรวมจุดทศนิยมให้ตรง เพื่อให้ระบบตรวจสอบรายการอัตโนมัติ',
  },
  {
    question: 'วิธีการฝากแบบ TrueWallet',
    answer: 'เลือกช่องทาง TrueWallet กรอกข้อมูลให้ครบและทำรายการตามคำแนะนำบนหน้าจอ',
  },
  {
    question: 'ยอดไม่เข้าทันที ทำยังไงดี?',
    answer: 'ตรวจสอบสถานะรายการและหลักฐานการโอน หากเกินเวลาที่แจ้งให้ติดต่อทีมงานพร้อมเลขรายการ',
  },
];

export default function MemberDragScrollController() {
  useEffect(() => {
    let drag: DragState | null = null;
    let suppressClickUntil = 0;
    let suppressClickRail: HTMLElement | null = null;

    const findRail = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>('[data-drag-scroll]') : null;

    const hydrateGuidePreview = () => {
      const guide = document.querySelector<HTMLElement>(GUIDE_SELECTOR);
      if (!guide) return;

      const existingList = guide.querySelector<HTMLElement>(':scope > .reference-guide-list');
      const existingMore = guide.querySelector<HTMLButtonElement>(':scope > button.reference-guide-more');
      if (existingList && existingMore) {
        guide.dataset.guidePreviewReady = 'true';
        return;
      }

      const heading = guide.querySelector<HTMLElement>(':scope > .reference-panel-heading');
      const list = document.createElement('div');
      list.className = 'reference-guide-list';

      HOME_GUIDE_ITEMS.forEach((guideItem, index) => {
        const item = document.createElement('div');
        item.className = 'reference-guide-item';

        const button = document.createElement('button');
        const panelId = `reference-guide-answer-${index + 1}`;
        button.type = 'button';
        button.className = 'reference-guide-question';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', panelId);

        const copy = document.createElement('span');
        copy.className = 'reference-guide-question-copy';
        copy.textContent = guideItem.question;

        const arrow = document.createElement('span');
        arrow.className = 'reference-guide-question-arrow';
        arrow.setAttribute('aria-hidden', 'true');

        const answer = document.createElement('div');
        answer.id = panelId;
        answer.className = 'reference-guide-answer';
        answer.hidden = true;
        answer.textContent = guideItem.answer;

        button.append(copy, arrow);
        item.append(button, answer);
        list.append(item);
      });

      const moreButton = document.createElement('button');
      moreButton.type = 'button';
      moreButton.className = 'reference-guide-more';
      moreButton.dataset.guidePopupTrigger = 'true';
      moreButton.textContent = 'ดูทั้งหมด';

      guide.replaceChildren();
      if (heading) guide.append(heading);
      guide.append(list, moreButton);
      guide.dataset.guidePreviewReady = 'true';
    };

    const toggleGuideItem = (button: HTMLButtonElement) => {
      const guide = button.closest<HTMLElement>(GUIDE_SELECTOR);
      const item = button.closest<HTMLElement>('.reference-guide-item');
      const answer = item?.querySelector<HTMLElement>(':scope > .reference-guide-answer');
      if (!guide || !item || !answer) return;

      const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
      guide.querySelectorAll<HTMLButtonElement>('.reference-guide-question').forEach((currentButton) => {
        currentButton.setAttribute('aria-expanded', 'false');
        currentButton.closest('.reference-guide-item')?.classList.remove('is-open');
        const currentAnswer = currentButton.closest('.reference-guide-item')?.querySelector<HTMLElement>(':scope > .reference-guide-answer');
        if (currentAnswer) currentAnswer.hidden = true;
      });

      if (shouldOpen) {
        button.setAttribute('aria-expanded', 'true');
        item.classList.add('is-open');
        answer.hidden = false;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const rail = findRail(event.target);
      if (!rail || rail.scrollWidth <= rail.clientWidth + 2) return;

      drag = {
        rail,
        pointerId: event.pointerId,
        startX: event.clientX,
        startScrollLeft: rail.scrollLeft,
        moved: false,
      };
      rail.setPointerCapture?.(event.pointerId);
      rail.classList.add('is-drag-ready');
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - drag.startX;
      if (!drag.moved && Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

      drag.moved = true;
      drag.rail.classList.remove('is-drag-ready');
      drag.rail.classList.add('is-dragging');
      drag.rail.scrollLeft = drag.startScrollLeft - deltaX * SOURCE_DRAG_MULTIPLIER;
      event.preventDefault();
    };

    const finishDrag = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const { rail, moved, pointerId } = drag;
      if (rail.hasPointerCapture?.(pointerId)) rail.releasePointerCapture(pointerId);
      rail.classList.remove('is-drag-ready', 'is-dragging');
      drag = null;

      if (moved) {
        suppressClickRail = rail;
        suppressClickUntil = performance.now() + 350;
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      const guideQuestion = event.target instanceof Element
        ? event.target.closest<HTMLButtonElement>(`${GUIDE_SELECTOR} .reference-guide-question`)
        : null;
      if (guideQuestion) {
        event.preventDefault();
        event.stopPropagation();
        toggleGuideItem(guideQuestion);
        return;
      }

      if (!suppressClickRail || performance.now() > suppressClickUntil) return;
      const rail = findRail(event.target);
      if (rail !== suppressClickRail) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClickRail = null;
      suppressClickUntil = 0;
    };

    const onNativeDragStart = (event: DragEvent) => {
      const rail = findRail(event.target);
      if (!rail) return;
      event.preventDefault();
    };

    hydrateGuidePreview();

    const guideObserver = new MutationObserver(hydrateGuidePreview);
    guideObserver.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove, { passive: false });
    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', finishDrag);
    document.addEventListener('dragstart', onNativeDragStart);
    document.addEventListener('click', onClickCapture, true);

    return () => {
      guideObserver.disconnect();
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', finishDrag);
      document.removeEventListener('pointercancel', finishDrag);
      document.removeEventListener('dragstart', onNativeDragStart);
      document.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return (
    <>
      <MemberSearchOverlay />
      <MemberGuideOverlay />
      <MemberLanguageOverlay />
    </>
  );
}
