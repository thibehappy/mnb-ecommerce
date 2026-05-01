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

/** Format a millimeter value into a French-locale "X,X cm" string (1 decimal). */
export function formatCmFromMm(mm: number): string {
  const cm = mm / 10;
  return `${cm.toFixed(1).replace('.', ',')} cm`;
}

export function uid(prefix = ''): string {
  const r = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36);
  return prefix ? `${prefix}_${t}${r}` : `${t}${r}`;
}
