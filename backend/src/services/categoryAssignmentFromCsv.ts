import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';

const TWO_TOKEN_HINTS: Record<string, string[]> = {
  'general-general': ['general'],
  'general-merchandise': ['general'],
  'winter-items': ['winter'],
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

function twoTokenPrefix(categorySlug: string): string {
  const s = (categorySlug || '').trim();
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
  if (first === 'winter') return ['winter'];
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

export function resolveCategoryId(hints: string[], cats: LeanCat[]): mongoose.Types.ObjectId | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  for (const h of hints) {
    const hn = norm(h);
    if (!hn) continue;
    let c = cats.find((x) => norm(x.slug) === hn);
    if (c) return c._id;
    c = cats.find((x) => norm(x.slug).startsWith(hn) || hn.startsWith(norm(x.slug)));
    if (c) return c._id;
    c = cats.find((x) => norm(x.name).includes(hn) || hn.includes(norm(x.name)));
    if (c) return c._id;
  }
  return null;
}

type ProductLean = {
  _id: mongoose.Types.ObjectId;
  slug?: string;
  sku?: string;
  barcode?: string;
  name?: string;
  category_id?: mongoose.Types.ObjectId;
};

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
    if (p.name) byName.set(String(p.name).trim().toLowerCase(), p);
  }

  let updated = 0;
  let skippedNoProduct = 0;
  let skippedNoCategory = 0;
  let unchanged = 0;
  const unresolvedHints = new Set<string>();

  for (const row of rows) {
    const hints = hintsForCategorySlug((row.category_slug || '').trim());
    const catId = resolveCategoryId(hints, cats);
    if (!catId) {
      skippedNoCategory++;
      hints.forEach((h) => unresolvedHints.add(h));
      continue;
    }

    const slugKey = (row.slug || '').trim().toLowerCase();
    const skuKey = normSkuBar(row.sku);
    const bcKey = normSkuBar(row.barcode);
    const nameKey = (row.name || '').trim().toLowerCase();

    const prod =
      (slugKey && bySlug.get(slugKey)) ||
      (skuKey && bySku.get(skuKey)) ||
      (bcKey && byBarcode.get(bcKey)) ||
      (nameKey && byName.get(nameKey)) ||
      null;

    if (!prod) {
      skippedNoProduct++;
      continue;
    }

    const cur = prod.category_id ? String(prod.category_id) : '';
    if (cur === String(catId)) {
      unchanged++;
      continue;
    }

    if (!dryRun) {
      await Product.updateOne(
        { _id: prod._id },
        { $set: { category_id: catId, updated_at: new Date() }, $unset: { sub_category_id: 1 } }
      );
    }
    updated++;
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
