# Shopify Integration — mnb-ecommerce (configurateur)

> Comment ce front Next.js parle à Shopify pour encaisser les paiements,
> tout en gardant 100 % du configurateur 2D côté front. Document de
> référence pour Thibe + futurs devs.

---

## TL;DR (5 lignes)

- Le **catalogue** (beads, charms, kits, ateliers) reste **mocké côté front** dans `src/lib/mocks/*` — Shopify ne porte pas les métadonnées 2D (hex, shape, sizeMm).
- Le **checkout** passe par Shopify via la Storefront API : 1 ligne par bracelet/kit, composition encodée en **line item properties**.
- Stack ajoutée : `src/lib/shopify/{client,variants,cart,use-checkout}.ts` + route POST `src/app/api/shopify/cart/route.ts`.
- 2 produits Shopify : "Bracelet personnalisé MNB" (3 variants) + "Kit DIY MNB" (6 variants). Importés via `scripts/generate_shopify_csv.py`.
- Token Shopify Storefront **partagé avec New-Site-MNB-2** (même store `30kjqi-mp`).

---

## 1. Architecture en 1 schéma

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONT Next.js (mnb-ecommerce)                                   │
│                                                                 │
│  /creer ── configurateur 2D ──> Zustand cart ──┐                │
│                                                ▼                │
│  /panier ── "Passer commande" ──> useShopifyCheckout()          │
│                                          │                      │
│                                          ▼ POST                 │
│                                  /api/shopify/cart              │
└─────────────────────────────────────────│───────────────────────┘
                                          │ shopifyFetch()
                                          ▼
                              ┌─────────────────────┐
                              │  Shopify Storefront │
                              │   GraphQL API       │
                              │                     │
                              │  cartCreate ──> id +│
                              │           checkoutUrl│
                              └────────┬────────────┘
                                       │ window.location.href = checkoutUrl
                                       ▼
                              ┌─────────────────────┐
                              │ Shopify Checkout    │
                              │ (paiement Stripe,   │
                              │  email, adresse,    │
                              │  livraison)         │
                              └─────────────────────┘
```

---

## 2. Setup initial (à faire UNE fois)

### 2.1 — Variables d'environnement

`.env.local` est déjà pré-rempli avec le token réutilisé de New-Site-MNB-2 (même store Shopify `30kjqi-mp`). À ouvrir et vérifier :

```bash
SHOPIFY_STORE_DOMAIN=30kjqi-mp.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=43d94ba90ba39fa2e857d5dceafdff60
SHOPIFY_API_VERSION=2025-01
SHOPIFY_HANDLE_BRACELET=bracelet-personnalise-mnb
SHOPIFY_HANDLE_KIT=kit-diy-mnb
```

> ⚠ Si tu rotates le token Storefront côté Shopify, mets à jour les **deux** `.env.local` (mnb-ecommerce + New-Site-MNB-2).

### 2.2 — Créer les 2 produits Shopify

```bash
python scripts/generate_shopify_csv.py
```

Génère `scripts/out/shopify_products.csv` (UTF-8 avec BOM, em-dash safe).

Puis dans Shopify Admin :
1. **Produits → Importer**
2. Sélectionner `shopify_products.csv`
3. Laisser le mapping par défaut → **Importer**
4. Vérifier : 2 produits, 9 variants au total.

**Produits créés** :

| Produit | Handle | Variants | Prix |
|---|---|---|---|
| Bracelet personnalisé MNB | `bracelet-personnalise-mnb` | Bar / Kawaii / Classique | 18 / 24 / 36 € |
| Kit DIY MNB | `kit-diy-mnb` | Classique Solo/Duo, Kawaii Solo/Duo, Kawaii Premium Solo/Duo | 36/65, 24/44, 30/55 € |

SKUs (utilisés par `src/lib/shopify/cart.ts` pour résoudre les variant GIDs) :
- `MNB-CUSTOM-BAR`, `MNB-CUSTOM-KAWAII`, `MNB-CUSTOM-CLASSIQUE`
- `MNB-KIT-CLASSIQUE-SOLO`, `MNB-KIT-CLASSIQUE-DUO`
- `MNB-KIT-KAWAII-SOLO`, `MNB-KIT-KAWAII-DUO`
- `MNB-KIT-KAWAII-PREMIUM-SOLO`, `MNB-KIT-KAWAII-PREMIUM-DUO`

### 2.3 — Activer Shopify Payments / Stripe

Si pas déjà fait sur ce store :
- Shopify Admin → Paramètres → Paiements → activer Shopify Payments OU Stripe externe.
- Pour les tests : activer **Bogus Gateway** (un test gateway natif Shopify).

### 2.4 — Test rapide

```bash
npm run dev
```

- Composer un bracelet sur `/creer` → "Ajouter au panier"
- Cliquer sur l'icône panier en haut → **CartDrawer s'ouvre**
- Cliquer "Passer au paiement" → spinner → redirect vers `30kjqi-mp.myshopify.com/checkouts/...`
- Ou aller sur `/panier` → même bouton.

---

## 3. Comment la composition voyage vers l'atelier

Pour chaque ligne `kind: 'custom'`, on attache des **line item properties** à la ligne Shopify. Visible dans `Shopify Admin → Commandes → [commande] → ligne du produit → propriétés` :

| Propriété | Visible client ? | Source |
|---|---|---|
| `Atelier` | ✅ | `atelier.name` |
| `Titre` | ✅ | `config.title` si défini |
| `Taille` / `Circonférence` | ✅ | `sizeLabel + sizeCm` ou somme `sizeMm` |
| `Finition` | ✅ | `config.fulfillmentMode` |
| `Figurine` | ✅ | nom de la figurine Kawaii |
| `Intention` | ✅ | message client |
| `Composition` | ✅ | "Turquoise ×4 · Perle nacrée ×6 · …" |
| `_design_id` | ❌ (caché) | UUID front |
| `_composition_detail` | ❌ (caché) | JSON complet (atelierId, components, figurine, attachments…) |

**Convention Shopify** : les clés préfixées `_` sont automatiquement masquées au client dans l'email + page de confirmation. L'atelier les voit dans l'admin.

Pour les `kind: 'kit'` : propriétés `Kit`, `Style`, `Bracelets inclus` + cachés `_kit_id` et `_kit_slug`.

---

## 4. V2 — Décrément automatique du stock par perle ✅

**Disponible depuis le 15/05/2026.** Pour chaque commande de bracelet personnalisé,
les SKUs `MNB-<bead_id>` et `MNB-<charm_id>` sont décrémentés automatiquement
via le webhook `orders/paid` + Admin API.

### 4.1 — Setup initial (à faire UNE fois)

#### a) Générer + importer les SKUs de stock

```bash
npm run shopify:csv:beads
```

Génère `scripts/out/shopify_beads.csv` (18 produits = 16 perles + 2 charms du mock).
Chaque produit a UNE variante "1 piece", SKU `MNB-<id>` (e.g. `MNB-bead_turquoise_8`).
Stock initial repris de `bead.stock` / `charm.stock`. **Publication désactivée**
(non visibles dans la boutique en ligne). Image Src = URL raw.githubusercontent.com
pinnée au SHA — **requiert que le repo soit public** au moment de l'import.

Importer ensuite dans Shopify Admin :
1. **Produits → Importer** → `shopify_beads.csv`
2. Confirmer le mapping (laisser les défauts)
3. Vérifier : **18 produits** ajoutés avec SKUs préfixés `MNB-bead_` ou `MNB-charm_`,
   chacun avec sa photo

> 🔁 **Si le repo redevient privé** : les URLs GitHub raw renverront 404.
> Fallback : `npm run shopify:upload-images` — pousse les PNGs via Admin
> API (staged uploads + `productCreateMedia`). Requiert les scopes Admin
> `read_products` + `write_products`.

#### b) Custom App pour le token Admin

`SHOPIFY_ADMIN_ACCESS_TOKEN` (déjà dans `.env.local`, réutilisé de New-Site-MNB-2) :
1. Shopify Admin → **Paramètres → Apps et canaux → Develop apps**
2. Custom app existante OU `Create app` (nom : "MNB Stock Manager")
3. **Configure Admin API scopes** — cocher :
   - `read_products`, `write_products` (write_products = upload photos en fallback)
   - `read_inventory`, `write_inventory`
   - `read_locations`
   - `read_orders` (pour décrémenter manuellement un order existant via `decrement-test?orderName=...`)
4. **Install app** → onglet **API credentials** → copier le token `shpat_…`

#### c) Subscribe le webhook orders/paid

1. Shopify Admin → **Paramètres → Notifications → Webhooks** → **Ajouter un endpoint webhook**
2. Topic : **Order payment** (orders/paid)
3. URL : `https://<your-deploy>.vercel.app/api/shopify/webhook/orders-paid`
4. Format : **JSON**
5. API version : laisser celle par défaut (matchera `SHOPIFY_API_VERSION`)
6. **Sauvegarder** → Shopify affiche un **Secret de signature** — copier-coller
   dans `SHOPIFY_WEBHOOK_SECRET` de `.env.local`

> ⚠ Tant que le webhook n'est pas subscrit, les commandes paient OK mais le
> stock n'est PAS décrémenté. Le `/api/shopify/admin/decrement-test` permet
> de tester la logique localement avant le subscribe.

### 4.2 — Tester en local sans webhook (dry-run)

L'endpoint `POST /api/shopify/admin/decrement-test` exécute la logique
de décrément sans signature HMAC. Pratique pour debug local :

```bash
# Dry-run — voir ce qui SERAIT décrémenté sans toucher au stock
curl -X POST http://localhost:3000/api/shopify/admin/decrement-test \
  -H "Content-Type: application/json" \
  -d '{
    "components": [
      {"kind": "bead", "refId": "bead_turquoise_8"},
      {"kind": "bead", "refId": "bead_pearl_8_baroque"},
      {"kind": "charm", "refId": "charm_tour_eiffel"}
    ],
    "dryRun": true
  }'

# Vrai décrément (-1 par item) :
curl -X POST http://localhost:3000/api/shopify/admin/decrement-test \
  -H "Content-Type: application/json" \
  -d '{
    "components": [
      {"kind": "bead", "refId": "bead_turquoise_8"}
    ],
    "dryRun": false
  }'
```

L'endpoint **404** automatiquement en `NODE_ENV=production`.

### 4.3 — Flow complet (commande → décrément)

```
1. Client compose bracelet sur /creer
   → Zustand cart → BraceletConfig avec components[]
2. Clic "Passer au paiement"
   → POST /api/shopify/cart
   → cart.ts encode components dans _composition_detail
   → redirect vers Shopify checkoutUrl
3. Client paie sur Shopify
   → Shopify émet orders/paid webhook
4. Webhook arrive sur /api/shopify/webhook/orders-paid
   → verify HMAC (SHOPIFY_WEBHOOK_SECRET)
   → parse line_items[*].properties → _composition_detail JSON
   → aggrège tous les refIds (× quantity de la ligne)
   → resolve refId → SKU "MNB-<refId>" → variant GID → inventoryItem GID
   → inventoryAdjustQuantities (decrement -1 par occurrence)
5. Stock Shopify à jour
```

### 4.4 — Limitations connues

- **Idempotence** : le webhook n'est pas idempotent. Si Shopify retry sur 5xx, le stock est décrémenté 2× la même commande. À fixer en stockant `order_id` traités (DB ou KV). **Risque réel mais rare** : Shopify ne retry que sur 5xx, et notre code ne renvoie 5xx que sur erreurs Admin API transientes.
- **SKUs manquants** : si un `refId` n'a pas son SKU `MNB-<refId>` sur Shopify, il est juste **loggué + skip** (warn, pas d'erreur). Le webhook reste 200 pour ne pas bloquer la commande.
- **Stock partagé avec New-Site-MNB-2** : les SKUs internes `MNB-<id>` sont **distincts** des produits "Perles Lapis-Lazuli 8mm" (lots vrac) de MNB-2. Si tu vends 50 perles en vrac côté MNB-2, ça **ne décrémente PAS** le stock individuel côté configurateur. À réconcilier manuellement OU via un script de sync — V2.1.

## 5. V2.1+ Backlog

### 5.1 — Idempotence du webhook

Stocker les `order_id` traités (Vercel KV ou Postgres). Au début du handler :
si l'order_id existe déjà, return 200 sans rien faire.

### 5.2 — Surcharges (Sanrio/Disney +6 €, charms extras +1/+3 €)

**Actuellement** : seul le prix de base de l'atelier est facturé (18/24/36 €).
Si le client met Hello Kitty, le `Charm.surcharge = 6` est ignoré côté Shopify.

**Solution** : créer un produit Shopify "Supplément" avec variants à 1 €, 3 €, 6 €
et émettre des cart lines additionnelles dans `buildShopifyLines()` quand
`surcharge > 0`. Le client verra plusieurs lignes — informatif et acceptable.

### 5.3 — /commande déprécié

L'ancien `src/app/(checkout)/commande/CheckoutClient.tsx` (formulaire mocké + `setTimeout`) **est toujours présent mais plus appelé** par aucun bouton. Peut être supprimé.

### 5.4 — Vider le cart après succès

**Actuellement** : le Zustand cart reste rempli après checkout. Si l'utilisateur revient, il revoit les mêmes lignes.

**Solution** : page `/commande/success?cart_id=<id>` que Shopify peut appeler en `additional_url` → `useCart.clear()` côté front.

### 5.5 — Sync stock MNB-2 ↔ configurateur

Quand un lot vrac est vendu côté New-Site-MNB-2 (e.g. "Perles Lapis 8mm × 20"),
décrémenter aussi le stock individuel `MNB-bead_lapis_8` de 20.
Faisable via un webhook secondaire `orders/paid` sur l'autre Headless channel,
ou via un script cron de reconcile.

---

## 6. Fichiers du système

### V1 (checkout)

| Fichier | Rôle |
|---|---|
| `scripts/generate_shopify_csv.py` | Génère `scripts/out/shopify_products.csv` (bracelets + kits) |
| `src/lib/shopify/client.ts` | `shopifyFetch()` — Storefront API |
| `src/lib/shopify/variants.ts` | Cache SKU → variant GID (bracelet + kit) |
| `src/lib/shopify/cart.ts` | `createShopifyCart(lines)` — encode composition en line item properties |
| `src/lib/shopify/use-checkout.ts` | Hook client `useShopifyCheckout()` — POST + redirect |
| `src/app/api/shopify/cart/route.ts` | POST endpoint `cartCreate` → `{ checkoutUrl }` |
| `src/components/commerce/CartDrawer.tsx` | Bouton "Passer au paiement" wiré |
| `src/app/(checkout)/panier/CartPageClient.tsx` | Bouton "Passer commande" wiré |
| `next.config.ts` | `cdn.shopify.com` ajouté aux `remotePatterns` |

### V2 (stock auto)

| Fichier | Rôle |
|---|---|
| `scripts/generate_bead_csv.ts` | Génère `scripts/out/shopify_beads.csv` (18 perles + charms) |
| `src/lib/shopify/admin-client.ts` | `adminFetch()` — Admin API (mutations inventaire) |
| `src/lib/shopify/stock.ts` | `decrementStockForComposition()` — aggregation + Admin API call |
| `src/app/api/shopify/webhook/orders-paid/route.ts` | Webhook handler avec HMAC verify |
| `src/app/api/shopify/admin/decrement-test/route.ts` | Endpoint manuel pour test local (dry-run par défaut) |

### Env

| Var | Usage |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | `30kjqi-mp.myshopify.com` |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | V1 — cartCreate, variants resolution |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | V2 — inventoryAdjustQuantities |
| `SHOPIFY_WEBHOOK_SECRET` | V2 — HMAC verify pour orders/paid |
| `SHOPIFY_API_VERSION` | `2025-01` |
| `SHOPIFY_HANDLE_BRACELET` | `bracelet-personnalise-mnb` |
| `SHOPIFY_HANDLE_KIT` | `kit-diy-mnb` |

---

## 7. Ajouter une nouvelle perle (workflow complet)

Le flow va du PNG brut à un SKU Shopify avec décrément automatique. **6 étapes**, dont une seule manuelle côté Shopify (re-import du CSV).

### Étape 1 — Préparer la photo

Le PNG doit être **carré, fond transparent, perle centrée**. Le script `detour:bead` automatise le détourage à partir d'une photo sur fond blanc :

```bash
npm run detour:bead -- "C:/path/IMG_4438.JPG" "public/photos/beads/bead_lapis_8.png"
```

Convention du nom de fichier : **`bead_<famille>_<taille>.png`** (e.g. `bead_lapis_8.png` pour Lapis-Lazuli 8 mm). L'`id` du catalogue doit matcher le nom de fichier (sans `.png`).

### Étape 2 — Ajouter l'entrée dans `src/lib/mocks/beads.ts`

```ts
{
  id: 'bead_lapis_8',          // ⚠ Doit matcher le nom du PNG
  name: 'Lapis-lazuli',
  family: 'lapis',              // cf. StoneFamily union dans src/types/index.ts
  hex: '#1F3C73',
  veinHex: '#5B7BAB',           // optionnel
  shape: 'round',               // round | faceted | nugget | tube | cube | heart | star | flower | bow
  sizeMm: 8,                    // diamètre — contribue à la circonférence du bracelet
  price: 2.6,                   // prix unitaire (pour les kits + futures features)
  stock: 100,                   // stock initial. Sera repris dans le CSV Shopify.
  description: 'Bleu nuit profond, mouchete d\'or.',
  meaning: ['sagesse', 'verite'],  // optionnel
  images: [],                   // laisser vide — rempli automatiquement par sync:beads
},
```

### Étape 3 — Régénérer le manifest des photos

```bash
npm run sync:beads
```

Met à jour `src/lib/mocks/bead-photos.generated.ts` (ne pas éditer à la main). À partir de là le front affiche la perle dans le configurateur.

### Étape 4 — Commit + push sur GitHub

```bash
git add public/photos/beads/bead_lapis_8.png \
        src/lib/mocks/beads.ts \
        src/lib/mocks/bead-photos.generated.ts
git commit -m "feat: add bead_lapis_8 to catalog"
git push
```

**Pourquoi `push` obligatoire** : la photo doit être accessible via `raw.githubusercontent.com` au moment où Shopify importe le CSV. Tant que c'est pas pushé, l'URL renvoie 404.

> Note : le repo doit rester **public** pour que Shopify puisse fetch les URLs. Si privé, voir §4.1 fallback `npm run shopify:upload-images`.

### Étape 5 — Régénérer le CSV Shopify

```bash
npm run shopify:csv:beads
```

Le script :
- Lit le SHA Git de HEAD automatiquement (plus de hardcode à entretenir)
- Vérifie que HEAD est pushé sur origin — warn si non
- Émet `scripts/out/shopify_beads.csv` avec 19 lignes (les 18 existantes + la nouvelle)

Override possible :
```bash
MNB_PHOTO_SHA=abc1234 npm run shopify:csv:beads   # pin à un SHA spécifique
```

### Étape 6 — Re-importer dans Shopify Admin

1. **Produits → Importer** → `scripts/out/shopify_beads.csv`
2. À l'écran de mapping, **cocher "Mettre à jour les produits existants"** (ou équivalent — handles identiques = update, sinon = create)
3. Shopify fetch les nouvelles URLs et ajoute la photo + crée le nouveau produit `mnb-bead-lapis-8` avec SKU `MNB-bead_lapis_8`, stock 100

À partir de là, dès qu'un client achète un bracelet contenant cette perle, le webhook `orders/paid` la décrémente automatiquement.

### Workflow équivalent pour les charms / figurines

Identique avec `src/lib/mocks/charms.ts` au lieu de `beads.ts`, et `npm run sync:charms` au lieu de `sync:beads`. Le PNG va dans :
- `public/photos/charms/<id>.png` si `kind: 'charm'`
- `public/photos/figurines/<id>.png` si `kind: 'figurine'`

Le `shopify:csv:beads` script inclut **les deux** (`BEADS` + `CHARMS` du mock).

### Cheat sheet — 6 commandes

```bash
# 1. Détourer (si photo brute)
npm run detour:bead -- "raw.jpg" "public/photos/beads/bead_lapis_8.png"
# 2. Editer src/lib/mocks/beads.ts (ajouter l'entree)
# 3. Sync photos
npm run sync:beads
# 4. Commit + push
git add public/photos/beads/bead_lapis_8.png src/lib/mocks/beads.ts src/lib/mocks/bead-photos.generated.ts
git commit -m "feat: add bead_lapis_8"
git push
# 5. Regenerer CSV
npm run shopify:csv:beads
# 6. Re-import dans Shopify Admin
```

---

## 8. Debug rapide

| Symptôme | Cause probable | Fix |
|---|---|---|
| 503 "Shopify is not configured" | env vars manquantes | `.env.local` doit contenir DOMAIN + TOKEN |
| 404 "Shopify variant not found for SKU MNB-CUSTOM-…" | CSV bracelet pas importé | `npm run shopify:csv:bracelets` puis import |
| 404 "Shopify variant not found for SKU MNB-bead_…" | CSV beads pas importé | `npm run shopify:csv:beads` puis import |
| 401 UNAUTHORIZED (Storefront) | mauvais token | token "public" du canal Headless (32 chars hex), pas le `shpat_…` |
| Webhook 401 "Invalid signature" | `SHOPIFY_WEBHOOK_SECRET` manquant ou incorrect | re-copier le secret depuis Shopify Admin > Webhooks |
| Webhook 503 "Admin API not configured" | `SHOPIFY_ADMIN_ACCESS_TOKEN` manquant | utiliser le token Admin (`shpat_…`) |
| Stock pas décrémenté après commande | webhook pas subscrit OU URL pas joignable | Shopify Admin > Webhooks > vérifier le statut des dernières deliveries |
| `decrement-test` retourne `skippedReason: "SKU not found"` | la perle n'est pas dans `shopify_beads.csv` | régénérer + ré-importer ; nouveaux beads ajoutés au mock doivent passer par `npm run shopify:csv:beads` |
| Em-dash mangé dans le CSV | regression encoding | re-générer (UTF-8 BOM forcé) |

---

## 9. Roadmap V2.1+

1. **Idempotence webhook** — table des `order_id` traités (§5.1)
2. **Surcharges Sanrio/Disney + charms extras** (§5.2)
3. **Clear cart après succès** (§5.4)
4. **Sync stock MNB-2 ↔ configurateur** (§5.5)
5. **Notification atelier** — orders/paid → Slack/email avec la fiche d'assemblage
6. **Suppression de l'ancien /commande** (§5.3)
