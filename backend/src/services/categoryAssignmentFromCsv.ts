import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';

const TWO_TOKEN_HINTS: Record<string, string[]> = {
  'general-general': ['general'],
  'general-merchandise': ['general'],
  'winter-items': ['winter-items', 'winter', 'winteritems'],
  'e-cigarettes': ['e-cigarettes', 'ecigarettes', 'e-cigarette'],
  'candy-snacks': ['candy-snacks', 'candy', 'snacks'],
  'health-beauty': ['health-beauty', 'health', 'beauty'],
  'nicotine-pouches': ['nicotine-pouches', 'nicotine'],
  'electronics-miccell': ['electronics'],
  'automotive-car': ['automotive'],
  'tobacco-sweet': ['tobacco'],
  'house-hold': ['household', 'house-hold'],
  'smoking-accessories': ['smoking-accessories', 'smoking'],
  'store-supplies': ['store-supplies', 'store'],
  'automotive-additives': ['automotive'],
  'tobacco-raw': ['tobacco'],
  'automotive-armor': ['automotive'],
  'tobacco-backwood': ['tobacco'],
  'tobacco-geek': ['tobacco'],
  'tobacco-swisher': ['tobacco'],
  'automotive-gas': ['automotive'],
  'electronics-duracell': ['electronics'],
  'electronics-s1907': ['electronics'],
  'electronics-s2267': ['electronics'],
  'electronics-s70': ['electronics'],
  'tobacco-black': ['tobacco'],
  'tobacco-blunt': ['tobacco'],
  'tobacco-dutch': ['tobacco'],
  'tobacco-ez': ['tobacco'],
  'tobacco-fire': ['tobacco'],
  'tobacco-game': ['tobacco'],
};

export type CsvAssignRow = {
  name?: string;
  slug?: string;
  category_slug?: string;
  sku?: string;
  barcode?: string;
};

export type LeanCat = { _id: mongoose.Types.ObjectId; name: string; slug: string };

/** Normalize fancy hyphens so two-token parsing matches CSV variants. */
function normalizeCsvCategorySlug(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
}

function twoTokenPrefix(categorySlug: string): string {
  const s = normalizeCsvCategorySlug(categorySlug);
  const parts = s.split('-').filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
  return s;
}

export function hintsForCategorySlug(catSlug: string): string[] {
  const two = twoTokenPrefix(catSlug);
  if (TWO_TOKEN_HINTS[two]) return TWO_TOKEN_HINTS[two];
  const first = (catSlug.split('-')[0] || '').toLowerCase();
  if (first === 'tobacco') return ['tobacco'];
  if (first === 'automotive') return ['automotive'];
  if (first === 'electronics') return ['electronics'];
  if (first === 'general') return ['general'];
  if (first === 'candy') return ['candy-snacks'];
  if (first === 'health') return ['health-beauty'];
  if (first === 'nicotine') return ['nicotine-pouches'];
  if (first === 'winter') return ['winter-items', 'winter', 'winteritems'];
  return ['general'];
}

export function normSkuBar(raw: string | undefined): string {
  if (raw == null) return '';
  let t = String(raw).trim();
  if (!t) return '';
  if (/^1E\+11$/i.test(t) || t === '1E+11') return '';
  if (/^\d+\.?\d*[eE][+\-]?\d+$/.test(t)) {
    const n = Number(t);
    if (Number.isFinite(n)) {
      if (Math.abs(n) >= 1e12) {
        try {
          return BigInt(Math.round(n)).toString();
        } catch {
          return String(Math.round(n));
        }
      }
      return String(Math.round(n));
    }
  }
  return t;
}

/**
 * Pick best Category for CSV hints. Uses scores so short slug prefixes (e.g. "wi")
 * do not steal matches, and name substring "winter" does not hit "wintergreen" categories.
 */
export function resolveCategoryId(
  hints: string[],
  cats: LeanCat[],
  csvTwoTokenKey: string = ''
): mongoose.Types.ObjectId | null {
  if (!cats.length) return null;

  const norm = (s: string) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const hintNorms = [...new Set(hints.map(norm).filter((h) => h.length >= 2))].sort((a, b) => b.length - a.length);
  const twoNorm = csvTwoTokenKey ? norm(csvTwoTokenKey) : '';

  const isWinterNoiseName = (nn: string, hn: string) =>
    hn === 'winter' && (nn.includes('wintergreen') || nn.includes('winterfresh'));

  let bestId: mongoose.Types.ObjectId | null = null;
  let bestScore = 0;
  let bestSlugLen = 0;

  for (const c of cats) {
    const sn = norm(c.slug);
    const nn = norm(c.name);
    let catScore = 0;

    if (twoNorm && sn && sn === twoNorm) {
      catScore = 1000;
    } else {
      for (const hn of hintNorms) {
        let s = 0;
        if (sn && sn === hn) s = 950;
        else if (sn && hn.length >= 4 && sn.startsWith(hn)) s = 450 + hn.length;
        else if (sn && sn.length >= 4 && hn.length >= 4 && hn.startsWith(sn)) s = 430 + sn.length;
        else if (sn && hn.length >= 4 && sn.includes(hn)) s = 350;
        else if (nn && hn.length >= 6 && nn.includes(hn)) {
          if (isWinterNoiseName(nn, hn)) s = 0;
          else s = 220;
        } else if (nn && hn.length >= 4 && nn.includes(hn)) {
          if (isWinterNoiseName(nn, hn)) s = 0;
          else s = 130;
        }
        if (s > catScore) catScore = s;
      }
    }

    if (catScore > bestScore || (catScore === bestScore && catScore > 0 && sn.length > bestSlugLen)) {
      bestScore = catScore;
      bestId = c._id;
      bestSlugLen = sn.length;
    }
  }

  return bestScore > 0 ? bestId : null;
}

type ProductLean = {
  _id: mongoose.Types.ObjectId;
  slug?: string;
  sku?: string;
  barcode?: string;
  name?: string;
  category_id?: mongoose.Types.ObjectId;
};

/** Keys to match product name (full row title vs last segment after ":"). */
function nameLookupKeys(raw: string | undefined): string[] {
  const t = String(raw ?? '').trim().toLowerCase();
  const keys = new Set<string>();
  if (t) {
    keys.add(t);
    keys.add(t.replace(/\s+/g, ' '));
  }
  if (t.includes(':')) {
    const tail = t.split(':').pop()?.trim();
    if (tail) {
      keys.add(tail);
      keys.add(tail.replace(/\s+/g, ' '));
    }
  }
  return [...keys].filter(Boolean);
}

export async function assignCategoriesFromCsvRows(rows: CsvAssignRow[], dryRun: boolean) {
  const cats = (await Category.find({}).select('_id name slug').lean()) as LeanCat[];

  const products = await Product.find({ is_active: { $ne: false } })
    .select('_id slug sku barcode name category_id')
    .lean();

  const bySlug = new Map<string, ProductLean>();
  const bySku = new Map<string, ProductLean>();
  const byBarcode = new Map<string, ProductLean>();
  const byName = new Map<string, ProductLean>();
  for (const p of products) {
    if (p.slug) bySlug.set(String(p.slug).toLowerCase(), p);
    const sku = normSkuBar(p.sku as string);
    if (sku) bySku.set(sku, p);
    const bc = normSkuBar(p.barcode as string);
    if (bc) byBarcode.set(bc, p);
    if (p.name) {
      for (const k of nameLookupKeys(p.name)) {
        byName.set(k, p);
      }
    }
  }

  let updated = 0;
  let skippedNoProduct = 0;
  let skippedNoCategory = 0;
  let unchanged = 0;
  const unresolvedHints = new Set<string>();
  const now = new Date();
  // Avoid duplicate updates when the CSV has repeated rows for the same product.
  const pending = new Map<string, { _id: mongoose.Types.ObjectId; categoryId: mongoose.Types.ObjectId }>();

  for (const row of rows) {
    const rowCatSlug = normalizeCsvCategorySlug(String(row.category_slug || '').trim());
    const twoKey = twoTokenPrefix(rowCatSlug);
    const hints = hintsForCategorySlug(rowCatSlug);
    const catId = resolveCategoryId(hints, cats, twoKey);
    if (!catId) {
      skippedNoCategory++;
      hints.forEach((h) => unresolvedHints.add(h));
      continue;
    }

    const slugKey = (row.slug || '').trim().toLowerCase();
    const skuKey = normSkuBar(row.sku);
    const bcKey = normSkuBar(row.barcode);

    let prod: ProductLean | null =
      (slugKey && bySlug.get(slugKey)) ||
      (skuKey && bySku.get(skuKey)) ||
      (bcKey && byBarcode.get(bcKey)) ||
      null;
    if (!prod) {
      for (const nk of nameLookupKeys(row.name)) {
        const p = byName.get(nk);
        if (p) {
          prod = p;
          break;
        }
      }
    }

    if (!prod) {
      skippedNoProduct++;
      continue;
    }

    const cur = prod.category_id ? String(prod.category_id) : '';
    if (cur === String(catId)) {
      unchanged++;
      continue;
    }

    const key = String(prod._id);
    const existing = pending.get(key);
    if (!existing) {
      pending.set(key, { _id: prod._id, categoryId: catId });
      updated++;
    } else if (String(existing.categoryId) !== String(catId)) {
      // Should not happen for correct CSV, but if it does, keep last mapping.
      pending.set(key, { _id: prod._id, categoryId: catId });
    }
  }

  if (!dryRun && pending.size) {
    const ops = Array.from(pending.values()).map(({ _id, categoryId }) => ({
      updateOne: {
        filter: { _id },
        update: {
          $set: { category_id: categoryId, updated_at: now },
          $unset: { sub_category_id: 1 },
        },
      },
    }));

    await Product.bulkWrite(ops, { ordered: false });
  }

  return {
    csvRows: rows.length,
    updated,
    unchanged,
    skippedNoProduct,
    skippedNoCategory,
    unresolvedHints: [...unresolvedHints],
    categoryCount: cats.length,
  };
}
