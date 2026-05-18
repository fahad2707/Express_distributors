import Product from '../models/Product';

/**
 * Generate a permanent 5-digit product identifier (10000–99999).
 *
 * Once stored on a product (as `sku`) this value is never regenerated or
 * mutated — every callsite first checks whether the product already has a
 * SKU and only invokes this helper when the field is empty.
 *
 * If the 5-digit space is exhausted (or we get repeated collisions), we
 * widen the search to 6 digits to keep new product creation working. This
 * keeps the contract "all newly issued IDs are 5 digits where possible"
 * while remaining safe at scale.
 */
export async function generateItemId(): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const id = String(Math.floor(10000 + Math.random() * 90000));
    const exists = await Product.findOne({ sku: id }).lean();
    if (!exists) return id;
  }
  // Fallback: 6 digits if the 5-digit space is full.
  for (let i = 0; i < 20; i++) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await Product.findOne({ sku: id }).lean();
    if (!exists) return id;
  }
  return String(Date.now() % 100000).padStart(5, '0');
}

/**
 * Fills empty SKU and/or barcode from barcode, PLU, or a generated id:
 * - If SKU is empty, uses barcode, then PLU, then a new generated SKU.
 * - If barcode is empty and SKU is set, copies SKU to barcode (when not taken by another product)
 *   so scanning at POS “barcode” and GET /products/barcode/:code can resolve the product.
 */
export async function backfillProductSkuAndBarcode(): Promise<{
  updated: number;
  examined: number;
  skippedNoChange: number;
  warnings: string[];
}> {
  const products = await Product.find({})
    .select('_id sku barcode plu')
    .lean();
  const examined = products.length;
  const warnings: string[] = [];
  let updated = 0;
  let skippedNoChange = 0;

  for (const p of products as { _id: { toString: () => string }; sku?: string; barcode?: string; plu?: string }[]) {
    const oid = p._id;
    const id = oid.toString();
    let newSku = (p.sku || '').trim();
    let newBc = (p.barcode || '').trim();
    const plu = (p.plu || '').trim();
    const origSku = newSku;
    const origBc = newBc;

    if (!newSku) {
      if (newBc) {
        const taken = await Product.findOne({ sku: newBc, _id: { $ne: oid } }).lean();
        if (!taken) newSku = newBc;
        else warnings.push(`[${id}] Cannot set SKU from barcode — "${newBc}" already used as another product's SKU.`);
      }
    }
    if (!newSku && plu) {
      const taken = await Product.findOne({ sku: plu, _id: { $ne: oid } }).lean();
      if (!taken) newSku = plu;
      else warnings.push(`[${id}] Cannot set SKU from PLU — "${plu}" already used as another product's SKU.`);
    }
    if (!newSku) {
      newSku = (await generateItemId()).trim();
    }

    if (newSku && !newBc) {
      const taken = await Product.findOne({ barcode: newSku, _id: { $ne: oid } }).lean();
      if (!taken) newBc = newSku;
      else
        warnings.push(
          `[${id}] Skipped copying SKU to barcode — "${newSku}" already used as another product's barcode.`
        );
    }

    if (newSku === origSku && newBc === origBc) {
      skippedNoChange++;
      continue;
    }

    const setDoc: { sku?: string; barcode?: string; updated_at: Date } = { updated_at: new Date() };
    if (newSku !== origSku) setDoc.sku = newSku;
    if (newBc !== origBc) setDoc.barcode = newBc;

    try {
      await Product.updateOne({ _id: oid }, { $set: setDoc });
      updated++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      warnings.push(`[${id}] Update failed: ${msg}`);
    }
  }

  return { updated, examined, skippedNoChange, warnings };
}
