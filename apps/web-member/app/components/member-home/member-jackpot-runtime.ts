'use client';

import { useSyncExternalStore } from 'react';

export const MEMBER_JACKPOT_BASE_VALUE = 196_464_585;
export const MEMBER_JACKPOT_EPOCH_MS = Date.UTC(2026, 7, 1, 0, 0, 0);
export const MEMBER_JACKPOT_TICK_MS = 1_800;
export const MEMBER_JACKPOT_RENDER_MS = 120;

const INCREMENT_PATTERN = [4, 7, 2, 6, 1, 5, 3] as const;
const INCREMENT_CYCLE_TOTAL = INCREMENT_PATTERN.reduce((total, increment) => total + increment, 0);

type JackpotListener = () => void;

let snapshot = MEMBER_JACKPOT_BASE_VALUE;
let timer: number | null = null;
const listeners = new Set<JackpotListener>();

export function useMemberJackpotLabel(configuredAmount: string) {
  const liveValue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return configuredJackpotLabel(configuredAmount) ?? formatMemberJackpotValue(liveValue);
}

/**
 * Keep the old deterministic 1.8s jackpot contract at every tick boundary,
 * but interpolate toward the next increment between boundaries. The rendered
 * label therefore advances in small steps instead of visibly jumping every
 * 1.8 seconds, while tests and seeded values remain deterministic.
 */
export function computeMemberJackpotValue(atMs: number) {
  const elapsedMs = Math.max(0, atMs - MEMBER_JACKPOT_EPOCH_MS);
  const completedTicks = Math.floor(elapsedMs / MEMBER_JACKPOT_TICK_MS);
  const progress = (elapsedMs % MEMBER_JACKPOT_TICK_MS) / MEMBER_JACKPOT_TICK_MS;
  const completeCycles = Math.floor(completedTicks / INCREMENT_PATTERN.length);
  const remainingTicks = completedTicks % INCREMENT_PATTERN.length;
  let increment = completeCycles * INCREMENT_CYCLE_TOTAL;

  for (let index = 0; index < remainingTicks; index += 1) {
    increment += INCREMENT_PATTERN[index] ?? 0;
  }

  const nextIncrement = INCREMENT_PATTERN[remainingTicks] ?? INCREMENT_PATTERN[0];
  return MEMBER_JACKPOT_BASE_VALUE + increment + nextIncrement * progress;
}

export function resolveMemberJackpotLabel(configuredAmount: string, atMs: number) {
  return configuredJackpotLabel(configuredAmount)
    ?? formatMemberJackpotValue(computeMemberJackpotValue(atMs));
}

export function formatMemberJackpotValue(value: number) {
  return Math.max(0, Math.floor(value)).toLocaleString('en-US');
}

function configuredJackpotLabel(value: string) {
  const normalized = value.trim();
  if (!normalized || !/\d/.test(normalized)) return null;
  const amount = Number(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(amount) ? normalized : null;
}

function subscribe(listener: JackpotListener) {
  listeners.add(listener);
  if (listeners.size === 1) startClock();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) stopClock();
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return MEMBER_JACKPOT_BASE_VALUE;
}

function startClock() {
  updateSnapshot();
  timer = window.setInterval(updateSnapshot, MEMBER_JACKPOT_RENDER_MS);
}

function stopClock() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

function updateSnapshot() {
  const nextValue = Math.floor(computeMemberJackpotValue(Date.now()));
  if (nextValue === snapshot) return;
  snapshot = nextValue;
  listeners.forEach((listener) => listener());
}
