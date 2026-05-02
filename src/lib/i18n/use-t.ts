'use client';

import { useLang } from './store';
import { lookup } from './messages';

/**
 * Translation hook. Returns:
 *   - `lang` : current language (`'FR' | 'EN'`)
 *   - `t(key, ...params)` : translator function. Pass extra args to fill
 *     `{0}`, `{1}`, … placeholders in the message.
 *
 * Usage :
 *   const { t, lang } = useT();
 *   <h1>{t('atelierSelect.title.line1')}</h1>
 *   <p>{t('bead.helper.empty', '17 cm')}</p>   // → "Encore 17 cm pour…"
 *
 * Keys come from src/lib/i18n/messages.ts. Missing translations fall
 * back to the FR string, then the raw key — so a half-translated
 * deploy never crashes, it just shows partial content.
 */
export function useT() {
  const lang = useLang((s) => s.lang);
  return {
    lang,
    t: (key: string, ...params: (string | number)[]) => {
      const raw = lookup(lang, key);
      if (params.length === 0) return raw;
      return raw.replace(/\{(\d+)\}/g, (_, i) => {
        const v = params[Number(i)];
        return v == null ? '' : String(v);
      });
    },
  };
}
