'use client';

import Image from 'next/image';
import { CHAINS, CLASPS } from '@/lib/mocks/attachments';
import { useConfigurator } from '@/lib/store/configurator';
import { haptic } from '@/lib/utils/feedback';
import { useT } from '@/lib/i18n/use-t';
import { cn } from '@/lib/utils/cn';

/**
 * Kawaii-only picker for the figurine attachment system :
 *   - small ball-chain (color choice)
 *   - snap ring or heart (shape + color choice)
 *
 * Mounted at the bottom of the CharmPicker when the atelier is Kawaii.
 * The user can set both before picking a figurine — the bracelet
 * preview only renders them once a figurine is in place, but the
 * choice is remembered either way.
 *
 * Each tile is a thumbnail of the actual product photo (so the user
 * sees exactly what will land on the bracelet) sitting on top of a
 * subtle color swatch derived from `hex` for quick visual scanning.
 */
export function AttachmentPicker() {
  const chainId = useConfigurator((s) => s.figurineChainId);
  const claspId = useConfigurator((s) => s.figurineClaspId);
  const setChain = useConfigurator((s) => s.setFigurineChain);
  const setClasp = useConfigurator((s) => s.setFigurineClasp);
  const { t } = useT();

  return (
    <div className="space-y-5 border-t border-[#EEE9E0] pt-5">
      <div>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h4 className="font-serif text-[15px] font-black uppercase tracking-tight text-[#2D3748]">
            {t('attach.chain.title')}
          </h4>
          <span className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
            {t('attach.chain.count', CHAINS.length)}
          </span>
        </div>
        <p className="mb-3 text-[12px] italic text-[#718096]">{t('attach.chain.subtitle')}</p>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {CHAINS.map((chain) => {
            const active = chainId === chain.id;
            return (
              <button
                key={chain.id}
                type="button"
                onClick={() => {
                  setChain(chain.id);
                  haptic(6);
                }}
                aria-pressed={active}
                aria-label={`${t('attach.chain.choose')} : ${chain.name}`}
                title={chain.name}
                className={cn(
                  'group relative aspect-square flex flex-col items-center justify-center gap-1.5 p-2 md:p-3 rounded-xl md:rounded-2xl border active:scale-95 transition-all touch-manipulation cursor-pointer',
                  active
                    ? 'bg-white border-[#3D5A73] shadow-md'
                    : 'bg-[#F5F0E8] border-transparent hover:border-[#3D5A73] hover:bg-white hover:shadow-md',
                )}
              >
                <div className="h-20 w-20 flex items-center justify-center">
                  {chain.images[0] ? (
                    <Image
                      src={chain.images[0]}
                      alt=""
                      width={80}
                      height={80}
                      className="h-20 w-20 object-contain"
                      unoptimized
                    />
                  ) : (
                    <span
                      className="block h-10 w-10 rounded-full ring-2 ring-white shadow-sm"
                      style={{ backgroundColor: chain.hex }}
                    />
                  )}
                </div>
                <p className="truncate text-center text-[10px] md:text-[11px] font-black uppercase tracking-tight text-[#2D3748] leading-tight w-full">
                  {chain.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h4 className="font-serif text-[15px] font-black uppercase tracking-tight text-[#2D3748]">
            {t('attach.clasp.title')}
          </h4>
          <span className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
            {t('attach.clasp.count', CLASPS.length)}
          </span>
        </div>
        <p className="mb-3 text-[12px] italic text-[#718096]">{t('attach.clasp.subtitle')}</p>
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {CLASPS.map((clasp) => {
            const active = claspId === clasp.id;
            return (
              <button
                key={clasp.id}
                type="button"
                onClick={() => {
                  setClasp(clasp.id);
                  haptic(6);
                }}
                aria-pressed={active}
                aria-label={`${t('attach.clasp.choose')} : ${clasp.name}`}
                title={clasp.name}
                className={cn(
                  'group relative aspect-square flex flex-col items-center justify-center gap-1.5 p-2 md:p-3 rounded-xl md:rounded-2xl border active:scale-95 transition-all touch-manipulation cursor-pointer',
                  active
                    ? 'bg-white border-[#3D5A73] shadow-md'
                    : 'bg-[#F5F0E8] border-transparent hover:border-[#3D5A73] hover:bg-white hover:shadow-md',
                )}
              >
                <div className="h-20 w-20 flex items-center justify-center">
                  {clasp.images[0] ? (
                    <Image
                      src={clasp.images[0]}
                      alt=""
                      width={80}
                      height={80}
                      className="h-20 w-20 object-contain"
                      unoptimized
                    />
                  ) : (
                    <span
                      className={cn(
                        'block h-10 w-10 ring-2 ring-white shadow-sm',
                        clasp.shape === 'heart' ? '' : 'rounded-full',
                      )}
                      style={{ backgroundColor: clasp.hex }}
                    />
                  )}
                </div>
                <p className="truncate text-center text-[9px] md:text-[10px] font-black uppercase tracking-tight text-[#2D3748] leading-tight w-full">
                  {clasp.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
