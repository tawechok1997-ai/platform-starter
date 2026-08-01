'use client';

import { useSyncExternalStore } from 'react';

export const MEMBER_JACKPOT_BASE_VALUE = 196_464_585;
export const MEMBER_JACKPOT_EPOCH_MS = Date.UTC(2026, 7, 1, 0, 0, 0);
export const MEMBER_JACKPOT_TICK_MS = 1_800;

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

export function computeMemberJackpotValue(atMs: number) {
  const elapsedTicks = Math.max(0, Math.floor((atMs - MEMBER_JACKPOT_EPOCH_MS) / MEMBER_JACKPOT_TICK_MS));
  const completeCycles = Math.floor(elapsedTicks / INCREMENT_PATTERN.length);
  const remainingTicks = elapsedTicks % INCREMENT_PATTERN.length;
  let increment = completeCycles * INCREMENT_CYCLE_TOTAL;

  for (let index = 0; index < remainingTicks; index += 1) {
    increment += INCREMENT_PATTERN[index] ?? 0;
  }

  return MEMBER_JACKPOT_BASE_VALUE + increment;
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
  timer = window.setInterval(updateSnapshot, MEMBER_JACKPOT_TICK_MS);
}

function stopClock() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

function updateSnapshot() {
  const nextValue = computeMemberJackpotValue(Date.now());
  if (nextValue === snapshot) return;
  snapshot = nextValue;
  listeners.forEach((listener) => listener());
}
