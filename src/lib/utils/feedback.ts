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

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  return audioContext;
}

/** Muted atelier-like sonic cue. Browsers only allow this after a user gesture. */
export function atelierSound(kind: 'stone' | 'soft' | 'success' = 'soft') {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const settings =
      kind === 'stone'
        ? { start: 760, end: 420, duration: 0.09, volume: 0.035 }
        : kind === 'success'
          ? { start: 620, end: 880, duration: 0.16, volume: 0.03 }
          : { start: 420, end: 520, duration: 0.08, volume: 0.022 };

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(settings.start, now);
    osc.frequency.exponentialRampToValueAtTime(settings.end, now + settings.duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(settings.volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + settings.duration + 0.02);
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
  atelierSound('success');
  celebrate(origin);
}
