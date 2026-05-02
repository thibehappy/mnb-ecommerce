'use client';

import { CheckCircle2, Circle, Sparkles, Wand2 } from 'lucide-react';
import type { BraceletCoachInsight, CoachAction } from '@/lib/harmony/coach';
import { cn } from '@/lib/utils/cn';

interface CreationCoachProps {
  insight: BraceletCoachInsight;
  onAction: (action: CoachAction) => void;
}

const TONE_CLASS: Record<BraceletCoachInsight['tone'], string> = {
  empty: 'border-[#EEE9E0] bg-white',
  progress: 'border-[#D9E4F0] bg-[#F4F8FB]',
  ready: 'border-[#BFD9C7] bg-[#F4FAF4]',
  issue: 'border-[#E5B8AE] bg-[#FFF1EE]',
};

export function CreationCoach({ insight, onAction }: CreationCoachProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border p-4 shadow-sm md:p-5',
        TONE_CLASS[insight.tone],
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
            <Wand2 size={14} strokeWidth={2.2} />
            Coach atelier
          </div>
          <div className="mt-3 flex items-end gap-3">
            <p className="font-serif text-[42px] font-black leading-none tracking-tight text-[#2D3748] tabular-nums">
              {insight.score}
            </p>
            <div className="pb-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                Score
              </p>
              <p className="font-serif text-[18px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                {insight.label}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/75">
            <div
              className="h-full rounded-full bg-[#3D5A73] transition-[width] duration-500"
              style={{ width: `${insight.score}%` }}
            />
          </div>
          <p className="mt-3 text-[12px] font-semibold italic leading-relaxed text-[#718096]">
            {insight.summary}
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-white/70 bg-white/70 p-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
              Signature
            </p>
            <p className="mt-1 font-serif text-[18px] font-black uppercase leading-tight tracking-tight text-[#2D3748]">
              {insight.signature}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {insight.checks.map((check) => {
                const Icon = check.ok ? CheckCircle2 : Circle;
                return (
                  <div
                    key={check.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[9px] font-black uppercase tracking-widest',
                      check.ok ? 'bg-[#EDF7F0] text-[#244A35]' : 'bg-[#F5F0E8] text-[#718096]',
                    )}
                  >
                    <Icon size={12} strokeWidth={2.4} />
                    {check.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            {insight.suggestions.length === 0 ? (
              <div className="flex min-h-[122px] items-center justify-center rounded-xl border border-white/70 bg-white/65 px-4 text-center">
                <p className="max-w-sm text-[12px] font-semibold italic leading-relaxed text-[#718096]">
                  La composition est équilibrée. La prochaine étape naturelle est le partage ou le
                  panier.
                </p>
              </div>
            ) : (
              insight.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="grid gap-3 rounded-xl border border-white/70 bg-white/70 p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#2D3748]">
                      {suggestion.label}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold leading-relaxed text-[#718096]">
                      {suggestion.detail}
                    </p>
                  </div>
                  {suggestion.action && (
                    <button
                      type="button"
                      onClick={() => onAction(suggestion.action!)}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D3748] px-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73]"
                    >
                      <Sparkles size={13} strokeWidth={2.2} />
                      Appliquer
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
