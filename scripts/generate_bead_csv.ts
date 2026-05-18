/**
 * Generate the Shopify product CSV for the bead/charm stock SKUs.
 *
 * Each bead and charm in src/lib/mocks/{beads,charms}.ts becomes ONE
 * Shopify product with ONE variant priced as "1 piece". These products
 * are NEVER added to a customer cart — they exist only so that the
 * `orders/paid` webhook can decrement their stock via the Admin API
 * after each successful bracelet purchase.
 *
 * SKU convention : `MNB-<id>` where `<id>` is the literal mock id, e.g.
 *   bead_turquoise_8   →  SKU "MNB-bead_turquoise_8"
 *   charm_tour_eiffel  →  SKU "MNB-charm_tour_eiffel"
 *
 * Visibility : these products are imported with `Published=FALSE` so they
 * don't appear in the storefront. The Admin API can still mutate their
 * inventory regardless of the Online Store sales channel.
 *
 * Why TypeScript rather than Python (like the bracelet CSV) :
 *   - Imports the catalog directly — no regex parsing of the .ts source.
 *   - Future bead additions automatically propagate to the CSV without
 *     touching this script.
 *   - Same encoding rigor (UTF-8 BOM) without subprocess pitfalls.
 *
 * Run :
 *   npx -y tsx scripts/generate_bead_csv.ts
 * Output :
 *   scripts/out/shopify_beads.csv
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { BEADS } from '../src/lib/mocks/beads';
import { CHARMS } from '../src/lib/mocks/charms';
import { CHAINS, CLASPS } from '../src/lib/mocks/attachments';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_PATH = resolve(__dirname, 'out/shopify_beads.csv');

/**
 * Resolve the Git SHA to embed in the GitHub raw URLs.
 *
 * Priority :
 *   1. MNB_PHOTO_SHA env var (escape hatch — useful in CI / when you want
 *      to override).
 *   2. The local HEAD SHA (typical dev case).
 *
 * The script also warns if HEAD isn't yet pushed to its upstream — in that
 * case Shopify will get 404 on the image URLs at import time. The user
 * just needs to `git push` and re-import (no script re-run needed because
 * the URLs are SHA-pinned).
 *
 * Requires the repo to be PUBLIC for raw.githubusercontent.com to respond
 * 200 to Shopify (no Authorization header in Shopify's fetcher). If the
 * repo goes private again, run `npm run shopify:upload-images` instead.
 */
function resolveGitSha(): string {
  if (process.env.MNB_PHOTO_SHA) return process.env.MNB_PHOTO_SHA.trim();
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8', cwd: resolve(__dirname, '..') }).trim();
  } catch {
    throw new Error(
      'Could not read git HEAD. Run this script from inside a git checkout, ' +
        'or set MNB_PHOTO_SHA=<sha> manually.',
    );
  }
}

function isHeadPushed(sha: string): boolean {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
      cwd: resolve(__dirname, '..'),
    }).trim();
    const remoteSha = execSync(`git rev-parse origin/${branch}`, {
      encoding: 'utf-8',
      cwd: resolve(__dirname, '..'),
    }).trim();
    // HEAD must be reachable from the remote tracking branch.
    execSync(`git merge-base --is-ancestor ${sha} ${remoteSha}`, {
      cwd: resolve(__dirname, '..'),
    });
    return true;
  } catch {
    return false;
  }
}

const SHA = resolveGitSha();
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/thibehappy/mnb-ecommerce/${SHA}/public`;

/**
 * Convert a front-side image path ("/photos/beads/bead_turquoise_8.png")
 * to its GitHub raw URL. Returns '' if no image is set on the catalog
 * entry — Shopify treats empty Image Src as "no change" rather than
 * "remove image".
 */
function publicImageToGithubUrl(localPath: string | undefined): string {
  if (!localPath) return '';
  return `${GITHUB_RAW_BASE}${localPath.startsWith('/') ? localPath : '/' + localPath}`;
}

// Columns mirror Shopify's standard import format. We use a subset matching
// the bracelet CSV generator for consistency.
const COLUMNS = [
  'Handle',
  'Title',
  'Body (HTML)',
  'Vendor',
  'Type',
  'Tags',
  'Published',
  'Option1 Name',
  'Option1 Value',
  'Variant SKU',
  'Variant Inventory Tracker',
  'Variant Inventory Qty',
  'Variant Inventory Policy',
  'Variant Fulfillment Service',
  'Variant Price',
  'Variant Compare At Price',
  'Variant Requires Shipping',
  'Variant Taxable',
  'Variant Barcode',
  'Variant Grams',
  'Image Src',
  'Image Position',
  'Image Alt Text',
  'Status',
] as const;

type Row = Partial<Record<(typeof COLUMNS)[number], string>>;

function csvField(value: string): string {
  if (value === '') return '';
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowToLine(row: Row): string {
  return COLUMNS.map((col) => csvField(row[col] ?? '')).join(',');
}

function handleFromId(id: string): string {
  // Shopify handles must be lowercase, no underscores. "bead_turquoise_8"
  // becomes "mnb-bead-turquoise-8".
  return `mnb-${id.replace(/_/g, '-').toLowerCase()}`;
}

function skuFromId(id: string): string {
  // Keep underscores in the SKU — they're allowed by Shopify and make the
  // mapping from refId → SKU trivial : `MNB-${refId}`.
  return `MNB-${id}`;
}

const rows: Row[] = [];

for (const bead of BEADS) {
  const imageUrl = publicImageToGithubUrl(bead.images[0]);
  rows.push({
    Handle: handleFromId(bead.id),
    Title: `[Stock] ${bead.name} ${bead.sizeMm}mm`,
    'Body (HTML)':
      `<p>${bead.description}</p>` +
      `<p><em>SKU interne — unite de stock decrementee automatiquement quand un bracelet contenant cette perle est commande.</em></p>`,
    Vendor: 'My Nice Bracelet',
    Type: 'Perle',
    Tags: `mnb-stock,perle,${bead.family},${bead.sizeMm}mm,${bead.shape}`,
    Published: 'FALSE', // hidden from storefront — internal stock SKU only
    'Option1 Name': 'Format',
    'Option1 Value': '1 piece',
    'Variant SKU': skuFromId(bead.id),
    'Variant Inventory Tracker': 'shopify',
    'Variant Inventory Qty': String(bead.stock),
    'Variant Inventory Policy': 'deny',
    'Variant Fulfillment Service': 'manual',
    'Variant Price': bead.price.toFixed(2),
    'Variant Requires Shipping': 'FALSE', // never in cart → no shipping
    'Variant Taxable': 'FALSE',
    'Variant Grams': '2',
    'Image Src': imageUrl,
    'Image Position': imageUrl ? '1' : '',
    'Image Alt Text': imageUrl ? bead.name : '',
    Status: 'active',
  });
}

for (const charm of CHARMS) {
  const licenseTag = charm.licensed ? `,${charm.licensed}` : '';
  const imageUrl = publicImageToGithubUrl(charm.images[0]);
  rows.push({
    Handle: handleFromId(charm.id),
    Title: `[Stock] ${charm.name}`,
    'Body (HTML)':
      `<p>${charm.description}</p>` +
      `<p><em>SKU interne ${charm.kind} — unite de stock decrementee automatiquement quand un bracelet contenant cet element est commande.</em></p>`,
    Vendor: 'My Nice Bracelet',
    Type: charm.kind === 'figurine' ? 'Figurine' : 'Charm',
    Tags: `mnb-stock,${charm.kind},${charm.category},${charm.material}${licenseTag}`,
    Published: 'FALSE',
    'Option1 Name': 'Format',
    'Option1 Value': '1 piece',
    'Variant SKU': skuFromId(charm.id),
    'Variant Inventory Tracker': 'shopify',
    'Variant Inventory Qty': String(charm.stock),
    'Variant Inventory Policy': 'deny',
    'Variant Fulfillment Service': 'manual',
    'Variant Price': charm.price.toFixed(2),
    'Variant Requires Shipping': 'FALSE',
    'Variant Taxable': 'FALSE',
    'Variant Grams': '3',
    'Image Src': imageUrl,
    'Image Position': imageUrl ? '1' : '',
    'Image Alt Text': imageUrl ? charm.name : '',
    Status: 'active',
  });
}

// Attachments (chains + clasps) — Kawaii figurine accessory system.
// The Attachment* types don't carry price/stock fields (they're picker
// accessories paired with a figurine, not standalone catalog items),
// so we default to 0.50 EUR symbolic price + 100 stock. Like the beads
// and charms above, these SKUs are NEVER added to a customer cart —
// they exist only so the webhook can decrement their stock when a
// Kawaii bracelet that uses them ships.
const ATTACHMENT_DEFAULT_PRICE = '0.50';
const ATTACHMENT_DEFAULT_STOCK = '100';

for (const chain of CHAINS) {
  const imageUrl = publicImageToGithubUrl(chain.images[0]);
  rows.push({
    Handle: handleFromId(chain.id),
    Title: `[Stock] ${chain.name}`,
    'Body (HTML)':
      `<p>Chaine a billes (accessoire figurine Kawaii) — ${chain.color}.</p>` +
      `<p><em>SKU interne attache — unite de stock decrementee automatiquement quand un bracelet Kawaii utilisant cette chaine est commande.</em></p>`,
    Vendor: 'My Nice Bracelet',
    Type: 'Chaine',
    Tags: `mnb-stock,attache,chain,${chain.color}`,
    Published: 'FALSE',
    'Option1 Name': 'Format',
    'Option1 Value': '1 piece',
    'Variant SKU': skuFromId(chain.id),
    'Variant Inventory Tracker': 'shopify',
    'Variant Inventory Qty': ATTACHMENT_DEFAULT_STOCK,
    'Variant Inventory Policy': 'deny',
    'Variant Fulfillment Service': 'manual',
    'Variant Price': ATTACHMENT_DEFAULT_PRICE,
    'Variant Requires Shipping': 'FALSE',
    'Variant Taxable': 'FALSE',
    'Variant Grams': '1',
    'Image Src': imageUrl,
    'Image Position': imageUrl ? '1' : '',
    'Image Alt Text': imageUrl ? chain.name : '',
    Status: 'active',
  });
}

for (const clasp of CLASPS) {
  const imageUrl = publicImageToGithubUrl(clasp.images[0]);
  rows.push({
    Handle: handleFromId(clasp.id),
    Title: `[Stock] ${clasp.name}`,
    'Body (HTML)':
      `<p>Anneau de fermeture (accessoire figurine Kawaii) — forme ${clasp.shape}.</p>` +
      `<p><em>SKU interne attache — unite de stock decrementee automatiquement quand un bracelet Kawaii utilisant cet anneau est commande.</em></p>`,
    Vendor: 'My Nice Bracelet',
    Type: 'Anneau',
    Tags: `mnb-stock,attache,clasp,${clasp.shape}`,
    Published: 'FALSE',
    'Option1 Name': 'Format',
    'Option1 Value': '1 piece',
    'Variant SKU': skuFromId(clasp.id),
    'Variant Inventory Tracker': 'shopify',
    'Variant Inventory Qty': ATTACHMENT_DEFAULT_STOCK,
    'Variant Inventory Policy': 'deny',
    'Variant Fulfillment Service': 'manual',
    'Variant Price': ATTACHMENT_DEFAULT_PRICE,
    'Variant Requires Shipping': 'FALSE',
    'Variant Taxable': 'FALSE',
    'Variant Grams': '1',
    'Image Src': imageUrl,
    'Image Position': imageUrl ? '1' : '',
    'Image Alt Text': imageUrl ? clasp.name : '',
    Status: 'active',
  });
}

mkdirSync(dirname(OUT_PATH), { recursive: true });
const header = COLUMNS.join(',');
// UTF-8 BOM so Excel on Windows opens it as UTF-8 (consistent with the
// bracelet CSV).
const csv = '﻿' + [header, ...rows.map(rowToLine)].join('\n') + '\n';
writeFileSync(OUT_PATH, csv, 'utf-8');

const pushed = isHeadPushed(SHA);
console.log(`Wrote ${rows.length} rows -> ${OUT_PATH}`);
console.log(`  ${BEADS.length} beads + ${CHARMS.length} charms + ${CHAINS.length} chains + ${CLASPS.length} clasps`);
console.log(`  Images pinned to commit ${SHA.slice(0, 12)}${pushed ? '' : '  ⚠ NOT pushed to origin yet'}`);
if (!pushed) {
  console.log('');
  console.log('WARNING : the SHA above is not on origin. Shopify will get 404 on the image URLs.');
  console.log('          Run `git push` BEFORE importing the CSV.');
}
console.log('');
console.log('Next steps:');
console.log('  1. (if not already done) git push');
console.log('  2. Shopify Admin > Produits > Importer > shopify_beads.csv');
console.log('  3. Cocher "Remplacer tous les produits existants ayant le meme handle"');
console.log('     pour mettre a jour les fiches deja importees, OU laisser decoche pour');
console.log('     ne creer que les nouvelles.');
