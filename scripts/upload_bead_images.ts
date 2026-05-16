/**
 * Upload bead/charm photos directly to the Shopify products via the Admin API.
 *
 * Why this script (and not Image Src in the CSV) ?
 *   The mnb-ecommerce repo is PRIVATE on GitHub, so raw.githubusercontent.com
 *   URLs return 404 to Shopify's image fetcher. Hosting the 18 PNGs on a
 *   public CDN would add an extra step ; the cleanest path is to push the
 *   bytes directly to Shopify via Admin API staged uploads.
 *
 * Three Admin API calls per product :
 *   1. `productByHandle`        — find the Shopify GID from the handle
 *   2. `stagedUploadsCreate`    — get a presigned upload URL
 *      (then HTTP POST the PNG bytes to that URL as multipart/form-data)
 *   3. `productCreateMedia`     — attach the staged file to the product
 *
 * Required Admin API scopes (custom dev app) :
 *   - read_products
 *   - write_products
 *   - (write_files implicit via staged upload)
 *
 * Idempotency : NOT idempotent. Re-running adds duplicate images. The
 * script logs each product before uploading so you can stop early if
 * needed.
 *
 * Run :
 *   npm run shopify:upload-images
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BEADS } from '../src/lib/mocks/beads';
import { CHARMS } from '../src/lib/mocks/charms';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PUBLIC_DIR = resolve(ROOT, 'public');

// ── load .env.local manually (no Next runtime when running standalone) ─
function loadEnvLocal(): void {
  const path = resolve(ROOT, '.env.local');
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnvLocal();

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? '';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? '';
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2025-01';

if (!SHOPIFY_DOMAIN || !ADMIN_TOKEN) {
  console.error('ERROR: SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN must be set in .env.local');
  process.exit(1);
}

const ADMIN_URL = `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

/* ─────────────────────────────────────────────────────────────
   Minimal Admin API GraphQL client
───────────────────────────────────────────────────────────── */

async function adminGql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ADMIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Admin HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (json.errors?.length) {
    throw new Error(`Admin GraphQL errors: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  if (!json.data) throw new Error('Admin response missing data');
  return json.data;
}

/* ─────────────────────────────────────────────────────────────
   Resolve product handle → Shopify product GID
───────────────────────────────────────────────────────────── */

async function getProductIdByHandle(handle: string): Promise<string | null> {
  const data = await adminGql<{ productByHandle: { id: string; title: string } | null }>(
    /* GraphQL */ `
      query ProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
        }
      }
    `,
    { handle },
  );
  return data.productByHandle?.id ?? null;
}

/* ─────────────────────────────────────────────────────────────
   Staged upload + attach to product
───────────────────────────────────────────────────────────── */

interface StagedTarget {
  url: string;
  resourceUrl: string;
  parameters: Array<{ name: string; value: string }>;
}

async function createStagedUpload(filename: string, fileSize: number): Promise<StagedTarget> {
  const data = await adminGql<{
    stagedUploadsCreate: {
      stagedTargets: StagedTarget[];
      userErrors: Array<{ field: string[] | null; message: string }>;
    };
  }>(
    /* GraphQL */ `
      mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
          userErrors { field message }
        }
      }
    `,
    {
      input: [
        {
          filename,
          mimeType: 'image/png',
          httpMethod: 'POST',
          resource: 'IMAGE',
          fileSize: String(fileSize),
        },
      ],
    },
  );
  if (data.stagedUploadsCreate.userErrors.length) {
    throw new Error(
      `stagedUploadsCreate: ${data.stagedUploadsCreate.userErrors.map((e) => e.message).join('; ')}`,
    );
  }
  const target = data.stagedUploadsCreate.stagedTargets[0];
  if (!target) throw new Error('stagedUploadsCreate returned no staged target');
  return target;
}

/**
 * Upload the PNG bytes to the presigned URL provided by stagedUploadsCreate.
 * Shopify uses Google Cloud Storage behind the scenes — the response is a
 * 204 No Content on success, no JSON body.
 */
async function uploadToStagedTarget(target: StagedTarget, fileBytes: Buffer, filename: string): Promise<void> {
  const formData = new FormData();
  // The parameters MUST be appended in the exact order Shopify returned them,
  // and the file MUST be the last field — GCS is strict about this.
  for (const param of target.parameters) {
    formData.append(param.name, param.value);
  }
  // Buffer → Uint8Array → Blob avoids "Cannot find name 'Buffer'" type issues
  // and works on Node 18+ where Blob is available natively.
  const blob = new Blob([new Uint8Array(fileBytes)], { type: 'image/png' });
  formData.append('file', blob, filename);

  const res = await fetch(target.url, { method: 'POST', body: formData });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Staged upload POST failed (${res.status}): ${text.slice(0, 500)}`);
  }
}

async function attachMediaToProduct(productId: string, resourceUrl: string, alt: string): Promise<void> {
  const data = await adminGql<{
    productCreateMedia: {
      media: Array<{ id: string; alt: string | null }>;
      mediaUserErrors: Array<{ field: string[] | null; message: string; code: string | null }>;
    };
  }>(
    /* GraphQL */ `
      mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media { ... on MediaImage { id alt } }
          mediaUserErrors { field message code }
        }
      }
    `,
    {
      productId,
      media: [
        {
          alt,
          mediaContentType: 'IMAGE',
          originalSource: resourceUrl,
        },
      ],
    },
  );
  if (data.productCreateMedia.mediaUserErrors.length) {
    throw new Error(
      `productCreateMedia: ${data.productCreateMedia.mediaUserErrors.map((e) => e.message).join('; ')}`,
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   Per-item upload
───────────────────────────────────────────────────────────── */

function handleFromId(id: string): string {
  return `mnb-${id.replace(/_/g, '-').toLowerCase()}`;
}

interface UploadItem {
  id: string;
  name: string;
  /** front-side path like "/photos/beads/bead_turquoise_8.png" */
  imagePath: string;
}

/**
 * Resolve the local PNG file for a bead/charm. Falls back through the
 * conventional folders if the mock's images[] field is empty.
 */
function resolveLocalPath(item: UploadItem): string | null {
  if (item.imagePath) {
    const absolute = join(PUBLIC_DIR, item.imagePath);
    if (existsSync(absolute)) return absolute;
  }
  // Fallback : look in each known photo folder by id.
  const candidates = [
    join(PUBLIC_DIR, 'photos', 'beads', `${item.id}.png`),
    join(PUBLIC_DIR, 'photos', 'charms', `${item.id}.png`),
    join(PUBLIC_DIR, 'photos', 'figurines', `${item.id}.png`),
  ];
  return candidates.find(existsSync) ?? null;
}

async function uploadOne(item: UploadItem): Promise<'uploaded' | 'no-photo' | 'no-product'> {
  const localPath = resolveLocalPath(item);
  if (!localPath) return 'no-photo';

  const handle = handleFromId(item.id);
  const productId = await getProductIdByHandle(handle);
  if (!productId) return 'no-product';

  const fileBytes = readFileSync(localPath);
  const filename = `${item.id}.png`;
  const target = await createStagedUpload(filename, fileBytes.byteLength);
  await uploadToStagedTarget(target, fileBytes, filename);
  await attachMediaToProduct(productId, target.resourceUrl, item.name);

  return 'uploaded';
}

/* ─────────────────────────────────────────────────────────────
   Main
───────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  const items: UploadItem[] = [
    ...BEADS.map((b) => ({ id: b.id, name: b.name, imagePath: b.images[0] ?? '' })),
    ...CHARMS.map((c) => ({ id: c.id, name: c.name, imagePath: c.images[0] ?? '' })),
  ];

  console.log(`Will upload ${items.length} photo(s) to Shopify products (sequential)\n`);

  let uploaded = 0;
  let skippedNoPhoto = 0;
  let skippedNoProduct = 0;
  const failures: Array<{ id: string; error: string }> = [];

  for (const item of items) {
    process.stdout.write(`  ${item.id.padEnd(36)} ... `);
    try {
      const result = await uploadOne(item);
      if (result === 'uploaded') {
        uploaded++;
        console.log('OK');
      } else if (result === 'no-photo') {
        skippedNoPhoto++;
        console.log('skipped (no local photo)');
      } else {
        skippedNoProduct++;
        console.log('skipped (no Shopify product with that handle)');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ id: item.id, error: msg });
      console.log(`FAILED: ${msg.slice(0, 200)}`);
    }
  }

  console.log('');
  console.log(`Done. Uploaded ${uploaded} / ${items.length}.`);
  if (skippedNoPhoto) console.log(`  ${skippedNoPhoto} skipped (no local photo)`);
  if (skippedNoProduct) console.log(`  ${skippedNoProduct} skipped (no Shopify product — was shopify_beads.csv imported?)`);
  if (failures.length) {
    console.log(`  ${failures.length} failed :`);
    for (const f of failures) console.log(`    - ${f.id}: ${f.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal:', err);
  process.exit(1);
});
