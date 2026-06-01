import Product from '../models/Product';

/** True when value looks like a permanent 5-digit product ID (not a UPC). */
export function isFiveDigitProductId(v: string): boolean {
  return /^\d{5}$/.test(String(v ?? '').trim());
}

/** True when value looks like a scannable SKU / UPC (long numeric or alphanumeric). */
export function isLongSkuCode(v: string): boolean {
  const t = String(v ?? '').trim();
  if (!t) return false;
  if (isFiveDigitProductId(t)) return false;
  return t.length >= 8 || /^\d{6,}$/.test(t);
}

/**
 * Generate a permanent 5-digit product identifier (10000–99999).
 * Stored in `product_id` — never regenerated once assigned.
 */
export async function generateProductId(): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));
    const exists = await Product.findOne({ product_id: id }).lean();
    if (!exists) return id;
  }
  for (let i = 0; i < 20; i++) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await Product.findOne({ product_id: id }).lean();
    if (!exists) return id;
  }
  return String(Date.now() % 100000).padStart(5, '0');
}

/**
 * One-time migration for existing catalog (~1400+ products):
 * - Long UPC/barcode values → `sku`
 * - Short 5-digit values wrongly stored in `sku` → `product_id`
 * - Assign new `product_id` where missing
 * - Clear legacy `barcode` / `plu` (no longer used)
 */
export async function migrateProductIdAndSku(): Promise<{
  updated: number;
  examined: number;
  skippedNoChange: number;
  warnings: string[];
}> {
  const products = await Product.find({})
    .select('_id product_id sku barcode plu')
    .lean();
  const examined = products.length;
  const warnings: string[] = [];
  let updated = 0;
  let skippedNoChange = 0;

  const usedProductIds = new Set<string>();
  for (const p of products) {
    const pid = String((p as { product_id?: string }).product_id || '').trim();
    if (pid) usedProductIds.add(pid);
  }

  for (const p of products as {
    _id: { toString: () => string };
    product_id?: string;
    sku?: string;
    barcode?: string;
    plu?: string;
  }[]) {
    const oid = p._id;
    const id = oid.toString();
    let productId = String(p.product_id || '').trim();
    let sku = String(p.sku || '').trim();
    const barcode = String(p.barcode || '').trim();
    const plu = String(p.plu || '').trim();
    const origProductId = productId;
    const origSku = sku;

    const longCandidates = [barcode, plu, isLongSkuCode(sku) ? sku : ''].filter(Boolean);
    let longSku = longCandidates[0] || '';

    if (!productId && sku && isFiveDigitProductId(sku)) {
      productId = sku;
      sku = longSku;
    } else if (!productId && sku && isLongSkuCode(sku)) {
      longSku = sku;
      sku = sku;
    } else if (!sku && longSku) {
      sku = longSku;
    } else if (!sku && barcode && !isFiveDigitProductId(barcode)) {
      sku = barcode;
    } else if (!sku && plu && !isFiveDigitProductId(plu)) {
      sku = plu;
    }

    if (!productId) {
      let candidate = '';
      for (let attempt = 0; attempt < 40; attempt++) {
        candidate = await generateProductId();
        if (!usedProductIds.has(candidate)) break;
      }
      if (usedProductIds.has(candidate)) {
        warnings.push(`[${id}] Could not allocate unique product_id`);
        continue;
      }
      productId = candidate;
      usedProductIds.add(productId);
    }

    if (productId === origProductId && sku === origSku && !barcode && !plu) {
      skippedNoChange++;
      continue;
    }

    try {
      await Product.updateOne(
        { _id: oid },
        {
          $set: {
            product_id: productId,
            sku: sku || undefined,
            updated_at: new Date(),
          },
          $unset: { barcode: 1, plu: 1 },
        }
      );
      updated++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`[${id}] Update failed: ${msg}`);
    }
  }

  return { updated, examined, skippedNoChange, warnings };
}
