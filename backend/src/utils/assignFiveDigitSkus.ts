import Product from '../models/Product';

/** Public product ID: exactly 5 digits, 10000–99999 (matches POS generator). */
const FIVE_DIGIT = /^[1-9]\d{4}$/;

export function isFiveDigitProductId(s: unknown): boolean {
  if (s == null) return false;
  const t = String(s).trim();
  return FIVE_DIGIT.test(t);
}

export type AssignFiveDigitMode = 'fill-gaps' | 'all';

export interface AssignFiveDigitSkusOptions {
  mode: AssignFiveDigitMode;
  dryRun?: boolean;
}

export interface AssignFiveDigitSkusResult {
  examined: number;
  toAssign: number;
  kept: number;
  updated: number;
  dryRun: boolean;
  assignments: Array<{ productId: string; oldSku: string; newSku: string }>;
  warnings: string[];
}

/**
 * Assign unique 5-digit SKUs (10000–99999) to products.
 *
 * - **fill-gaps** (default): keep SKU if it is already a unique 5-digit code;
 *   otherwise assign a new one (missing, wrong length, non-numeric, duplicates).
 * - **all**: assign a new 5-digit SKU to every product (use only when you
 *   intentionally want to replace existing codes — e.g. syncing with a new catalog).
 *
 * Barcode: if barcode was empty or equal to the old SKU, it is set to the new SKU
 * when no other product already uses that barcode.
 */
export async function assignFiveDigitSkus(opts: AssignFiveDigitSkusOptions): Promise<AssignFiveDigitSkusResult> {
  const { mode, dryRun = false } = opts;
  const warnings: string[] = [];
  const assignments: Array<{ productId: string; oldSku: string; newSku: string }> = [];

  const products = await Product.find({})
    .select('_id sku barcode')
    .sort({ _id: 1 })
    .lean();

  const examined = products.length;
  type Row = { _id: { toString: () => string }; sku?: string; barcode?: string };
  const rows = products as Row[];

  const skuCounts = new Map<string, number>();
  for (const p of rows) {
    const s = (p.sku || '').trim();
    if (!s) continue;
    skuCounts.set(s, (skuCounts.get(s) || 0) + 1);
  }

  const needsNewSku = (p: Row): boolean => {
    if (mode === 'all') return true;
    const s = (p.sku || '').trim();
    if (!s) return true;
    if (!isFiveDigitProductId(s)) return true;
    if ((skuCounts.get(s) || 0) > 1) return true;
    return false;
  };

  const reassign: Row[] = [];
  const keep: Row[] = [];
  for (const p of rows) {
    if (needsNewSku(p)) reassign.push(p);
    else keep.push(p);
  }

  const used = new Set<string>();
  for (const p of keep) {
    const s = (p.sku || '').trim();
    if (s) used.add(s);
  }

  const pickNewSku = (): string => {
    for (let attempt = 0; attempt < 50000; attempt++) {
      const id = String(Math.floor(10000 + Math.random() * 90000));
      if (!used.has(id)) {
        used.add(id);
        return id;
      }
    }
    throw new Error('Unable to allocate a free 5-digit SKU (pool exhausted).');
  };

  const plan = new Map<string, { oldSku: string; newSku: string }>();
  for (const p of reassign) {
    const pid = p._id.toString();
    const oldSku = (p.sku || '').trim();
    const newSku = pickNewSku();
    plan.set(pid, { oldSku, newSku });
    assignments.push({ productId: pid, oldSku: oldSku || '(empty)', newSku });
  }

  let updated = 0;
  if (!dryRun) {
    for (const p of reassign) {
      const pid = p._id.toString();
      const entry = plan.get(pid);
      if (!entry) continue;
      const { newSku, oldSku } = entry;
      const oldBc = (p.barcode || '').trim();
      const setDoc: { sku: string; barcode?: string; updated_at: Date } = {
        sku: newSku,
        updated_at: new Date(),
      };

      const shouldMirrorBarcode = !oldBc || oldBc === oldSku;
      if (shouldMirrorBarcode) {
        const taken = await Product.findOne({
          barcode: newSku,
          _id: { $ne: p._id },
        }).lean();
        if (!taken) setDoc.barcode = newSku;
        else
          warnings.push(
            `[${pid}] New SKU ${newSku} not copied to barcode — already used as another product's barcode.`
          );
      }

      try {
        await Product.updateOne({ _id: p._id }, { $set: setDoc });
        updated++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        warnings.push(`[${pid}] Update failed: ${msg}`);
      }
    }
  }

  return {
    examined,
    toAssign: reassign.length,
    kept: keep.length,
    updated: dryRun ? 0 : updated,
    dryRun,
    assignments,
    warnings,
  };
}
