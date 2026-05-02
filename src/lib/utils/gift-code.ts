/**
 * Gift card code helpers.
 *
 * Codes use the format `MNB-XXXX-YYYY` where X / Y are uppercase
 * alphanumerics drawn from a confusion-free alphabet (no `0`/`O`, no
 * `1`/`I`/`L`, etc.). 8 random chars over the 28-char alphabet gives
 * ~5.3 × 10¹¹ combinations — plenty for the demo (we don't actually
 * persist this server-side here, and collisions are rejected at create
 * time by the gift-cards store).
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomBlock(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    out += ALPHABET[idx];
  }
  return out;
}

/** Generate a fresh `MNB-XXXX-YYYY` code. Caller is responsible for ensuring
 *  uniqueness against existing codes (the gift-cards store handles this). */
export function generateGiftCode(): string {
  return `MNB-${randomBlock(4)}-${randomBlock(4)}`;
}

/** Strip whitespace, lowercase, non-alphanumeric noise from a user-typed
 *  code and re-emit it in canonical `MNB-XXXX-YYYY` form. Returns `null`
 *  when the input doesn't match the expected shape. */
export function normalizeGiftCode(raw: string): string | null {
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  // Tolerate users pasting with or without the MNB prefix.
  const stripped = cleaned.startsWith('MNB') ? cleaned.slice(3) : cleaned;
  if (stripped.length !== 8) return null;
  return `MNB-${stripped.slice(0, 4)}-${stripped.slice(4, 8)}`;
}

/** Best-effort visual reformat (used for UI display while typing). Keeps
 *  whatever the user has so far but inserts the dashes at expected
 *  positions. Never returns null. */
export function formatGiftCodeInput(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const stripped = cleaned.startsWith('MNB') ? cleaned.slice(3) : cleaned;
  const limited = stripped.slice(0, 8);
  if (limited.length === 0) return '';
  if (limited.length <= 4) return `MNB-${limited}`;
  return `MNB-${limited.slice(0, 4)}-${limited.slice(4)}`;
}
