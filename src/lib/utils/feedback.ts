'use client';

import confetti from 'canvas-confetti';

/** Haptic feedback on mobile (no-op desktop) */
export function haptic(pattern: number | number[] = 12) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* noop */
  }
}

/** Celebration confetti — MNB brand colors only */
export function celebrate(origin?: { x: number; y: number }) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const defaults = {
    spread: 80,
    ticks: 90,
    gravity: 1,
    decay: 0.94,
    startVelocity: 28,
    colors: ['#3D5A73', '#5A7088', '#A8BED4', '#D4A8A0', '#EDE4D3', '#2D3748'],
  };

  confetti({
    ...defaults,
    origin: origin ?? { x: 0.5, y: 0.7 },
    particleCount: 42,
    scalar: 0.9,
  });
  setTimeout(() => {
    confetti({
      ...defaults,
      origin: origin ?? { x: 0.5, y: 0.65 },
      particleCount: 22,
      scalar: 1.2,
      shapes: ['circle'],
    });
  }, 120);
}

/** All-in-one : one success moment (add to cart, save, etc.) */
export function successMoment(origin?: { x: number; y: number }) {
  haptic([8, 24, 8]);
  celebrate(origin);
}
