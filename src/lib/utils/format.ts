const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number): string {
  if (Number.isInteger(amount)) {
    return priceFormatter.format(amount);
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Format a millimeter value into a localised length string.
 *
 *   - FR (default) : "X,X cm" (1 decimal, French comma)
 *   - EN           : "X.X in" (1 decimal, dot — converted via /25.4)
 *
 * Used for bracelet circumference + fit messages. Bead diameters keep
 * their own helper (`formatBeadSize`) because mm is the worldwide jewelry
 * standard for bead size, even in English markets.
 */
export function formatCmFromMm(mm: number, lang: 'FR' | 'EN' = 'FR'): string {
  if (lang === 'EN') {
    return `${(mm / 25.4).toFixed(1)} in`;
  }
  const cm = mm / 10;
  return `${cm.toFixed(1).replace('.', ',')} cm`;
}

/**
 * Format a bead diameter (in mm) for display under a tile or in a tooltip.
 * In English markets we surface a fractional inch alongside the mm so
 * users have a familiar reference; FR stays "X mm" only.
 */
export function formatBeadSize(mm: number, lang: 'FR' | 'EN' = 'FR'): string {
  if (lang === 'EN') {
    return `${(mm / 25.4).toFixed(2)} in`;
  }
  return `${mm.toString().replace('.', ',')} mm`;
}

/** Format a single cm value (e.g. for the size selector pill). */
export function formatCm(cm: number, lang: 'FR' | 'EN' = 'FR'): string {
  if (lang === 'EN') {
    return `${(cm / 2.54).toFixed(1)} in`;
  }
  return `${cm.toString().replace('.', ',')} cm`;
}

/**
 * Compact "current/target" length for the tab badge — no unit suffix at all
 * so it fits inside a narrow pill alongside two siblings. The unit is
 * unambiguous from context (size selector pill above the bracelet shows
 * "S · 17 cm" / "M · 17 cm" / etc).
 *
 *   FR : "0,0/17"
 *   EN : "0.0/6.7"
 */
export function formatLengthRangeCompact(
  currentMm: number,
  targetMm: number,
  lang: 'FR' | 'EN' = 'FR',
): string {
  if (lang === 'EN') {
    const cur = (currentMm / 25.4).toFixed(1);
    const tgt = (targetMm / 25.4).toFixed(1);
    return `${cur}/${tgt}`;
  }
  const cur = (currentMm / 10).toFixed(1).replace('.', ',');
  const tgt = (targetMm / 10).toFixed(0);
  return `${cur}/${tgt}`;
}

export function uid(prefix = ''): string {
  const r = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return prefix ? `${prefix}_${t}${r}` : `${t}${r}`;
}
