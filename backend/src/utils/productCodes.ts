import Product from '../models/Product';

export async function generateItemId(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await Product.findOne({ sku: id });
    if (!exists) return id;
  }
  return String(Date.now() % 1000000).padStart(6, '0');
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
