"""Generate the Shopify product CSV for the bracelet configurator.

Two products to import :

  1. "Bracelet personnalise MNB" — 3 variants (Bar / Kawaii / Classique)
     Used when a customer completes the configurator (/creer) and clicks
     "Ajouter au panier" then "Passer au paiement". The composition (beads
     order, figurine, size, fulfillment mode) is sent to Shopify as line
     item properties — NOT as separate Shopify products, so the customer
     sees one clean line in the cart.

  2. "Kit DIY MNB" — 6 variants (3 categories × Solo/Duo)
     Used for the pre-defined kits in /kits. The specific kit chosen
     (Jardin Parisien, Nuit Etoilee, etc.) is passed in line item
     properties.

Why CSV and not Admin API ?
  - No Admin API token needed (only the public Storefront token).
  - Reproducible : the user can re-import or edit in Shopify after.
  - Fits Shopify's standard product onboarding flow.

Output : scripts/out/shopify_products.csv (UTF-8 BOM, em-dash safe).

Usage :
  python scripts/generate_shopify_csv.py
  → Then : Shopify Admin > Produits > Importer > shopify_products.csv

Encoding note :
  We write with `encoding="utf-8-sig"` so Excel on Windows opens it as
  proper UTF-8 (no mojibake on accents / em-dash). Shopify import handles
  the BOM gracefully.
"""

from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts" / "out"
OUT.mkdir(parents=True, exist_ok=True)
CSV_PATH = OUT / "shopify_products.csv"

# Shopify standard product import columns (subset that we actually need).
# Full reference : https://help.shopify.com/en/manual/products/import-export/using-csv
COLUMNS = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Variant SKU",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Variant Barcode",
    "Variant Grams",
    "Image Src",
    "Image Position",
    "Image Alt Text",
    "Status",
]


def row(**fields: str) -> dict[str, str]:
    """Build a single CSV row with every column defaulted to empty string."""
    base = {col: "" for col in COLUMNS}
    base.update(fields)
    return base


def bracelet_rows() -> list[dict[str, str]]:
    """One product "Bracelet personnalise MNB" with 3 variants."""
    handle = "bracelet-personnalise-mnb"
    title = "Bracelet personnalise MNB"
    body = (
        "<p>Votre bracelet compose sur mesure dans notre configurateur en ligne. "
        "La composition exacte (perles, charms, taille, finition) est enregistree "
        "dans les details de votre commande et envoyee a notre atelier parisien.</p>"
        "<ul>"
        "<li><strong>Bracelet Bar</strong> — perles et nacre, fil elastique (18&euro;)</li>"
        "<li><strong>Kawaii</strong> — perles pastel + 1 figurine, fil de fer memoire (24&euro;)</li>"
        "<li><strong>Classique</strong> — toutes pierres + charms, fil elastique (36&euro;)</li>"
        "</ul>"
        "<p>Personnalisez votre bracelet ici : "
        "<a href=\"https://mynicebracelet.com/creer\">mynicebracelet.com/creer</a></p>"
    )
    variants = [
        ("Bracelet Bar",  "MNB-CUSTOM-BAR",       "18.00"),
        ("Kawaii",        "MNB-CUSTOM-KAWAII",    "24.00"),
        ("Classique",     "MNB-CUSTOM-CLASSIQUE", "36.00"),
    ]
    rows: list[dict[str, str]] = []
    for idx, (variant_name, sku, price) in enumerate(variants):
        is_first = idx == 0
        rows.append(row(
            Handle=handle,
            Title=title if is_first else "",
            **{
                "Body (HTML)": body if is_first else "",
                "Vendor": "My Nice Bracelet" if is_first else "",
                "Type": "Bracelet personnalise" if is_first else "",
                "Tags": "configurateur,mnb-custom" if is_first else "",
                "Published": "TRUE" if is_first else "",
                "Option1 Name": "Atelier",
                "Option1 Value": variant_name,
                "Variant SKU": sku,
                "Variant Inventory Tracker": "shopify",
                # No inventory tracking on the master bracelet variant — stock is
                # tracked per individual bead/charm (V2). For V1, infinity stock
                # on this synthetic product, the real stock check happens at the
                # bead-level which we'll wire post-MVP.
                "Variant Inventory Qty": "10000",
                "Variant Inventory Policy": "continue",
                "Variant Fulfillment Service": "manual",
                "Variant Price": price,
                "Variant Compare At Price": "",
                "Variant Requires Shipping": "TRUE",
                "Variant Taxable": "TRUE",
                "Variant Grams": "20",  # ~20g per assembled bracelet
                "Status": "active" if is_first else "",
            }
        ))
    return rows


def kit_rows() -> list[dict[str, str]]:
    """One product "Kit DIY MNB" with 6 variants (3 categories × Solo/Duo)."""
    handle = "kit-diy-mnb"
    title = "Kit DIY MNB"
    body = (
        "<p>Coffret pret-a-faire livre avec toutes les perles, charms, le fil "
        "et la notice illustree pour composer votre bracelet a la maison.</p>"
        "<ul>"
        "<li><strong>Classique</strong> — pierres semi-precieuses + charms metalliques</li>"
        "<li><strong>Kawaii</strong> — perles pastel + figurines kawaii</li>"
        "<li><strong>Kawaii Premium</strong> — figurines Sanrio / Disney officielles</li>"
        "</ul>"
        "<p>Decouvrez nos kits : "
        "<a href=\"https://mynicebracelet.com/kits\">mynicebracelet.com/kits</a></p>"
    )
    # (variant_name, sku, price)
    variants = [
        ("Classique Solo",          "MNB-KIT-CLASSIQUE-SOLO",       "36.00"),
        ("Classique Duo",           "MNB-KIT-CLASSIQUE-DUO",        "65.00"),
        ("Kawaii Solo",             "MNB-KIT-KAWAII-SOLO",          "24.00"),
        ("Kawaii Duo",              "MNB-KIT-KAWAII-DUO",           "44.00"),
        ("Kawaii Premium Solo",     "MNB-KIT-KAWAII-PREMIUM-SOLO",  "30.00"),
        ("Kawaii Premium Duo",      "MNB-KIT-KAWAII-PREMIUM-DUO",   "55.00"),
    ]
    rows: list[dict[str, str]] = []
    for idx, (variant_name, sku, price) in enumerate(variants):
        is_first = idx == 0
        # Duo = 2 bracelets in one shipment → heavier
        weight = "60" if "Duo" in variant_name else "30"
        rows.append(row(
            Handle=handle,
            Title=title if is_first else "",
            **{
                "Body (HTML)": body if is_first else "",
                "Vendor": "My Nice Bracelet" if is_first else "",
                "Type": "Kit DIY" if is_first else "",
                "Tags": "kit,mnb-kit" if is_first else "",
                "Published": "TRUE" if is_first else "",
                "Option1 Name": "Kit",
                "Option1 Value": variant_name,
                "Variant SKU": sku,
                "Variant Inventory Tracker": "shopify",
                "Variant Inventory Qty": "100",
                "Variant Inventory Policy": "deny",
                "Variant Fulfillment Service": "manual",
                "Variant Price": price,
                "Variant Compare At Price": "",
                "Variant Requires Shipping": "TRUE",
                "Variant Taxable": "TRUE",
                "Variant Grams": weight,
                "Status": "active" if is_first else "",
            }
        ))
    return rows


def main() -> None:
    rows = bracelet_rows() + kit_rows()
    # encoding="utf-8-sig" adds a BOM so Excel on Windows opens it as UTF-8.
    with CSV_PATH.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    print(f"Wrote {len(rows)} rows -> {CSV_PATH}")
    print(f"  Bracelet personnalise MNB : 3 variants")
    print(f"  Kit DIY MNB              : 6 variants")
    print("")
    print("Next steps:")
    print("  1. Shopify Admin > Produits > Importer > shopify_products.csv")
    print("  2. Confirmer le mapping (laisser les defauts)")
    print("  3. Verifier les 9 variants importes")


if __name__ == "__main__":
    main()
