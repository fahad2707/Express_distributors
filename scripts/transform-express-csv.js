#!/usr/bin/env node
/**
 * Transforms Express_Distributors_Structured_Product_List.csv into the exact
 * schema of product-import-sample.csv and writes Express_Distributors_Import_Ready.csv.
 * No backend changes. Run from project root:
 *   node scripts/transform-express-csv.js
 * Input file: Express_Distributors_Structured_Product_List.csv (in project root or cwd).
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(process.cwd(), 'Express_Distributors_Structured_Product_List.csv');
const OUTPUT_FILE = path.join(process.cwd(), 'Express_Distributors_Import_Ready.csv');

// ---- CSV parse (handles quoted fields, no newlines inside fields) ----
function parseCSVLine(line) {
  const out = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(field.trim());
      field = '';
    } else {
      field += c;
    }
  }
  out.push(field.trim());
  return out;
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.map((line) => parseCSVLine(line));
}

// ---- Helpers ----
function toSlug(text) {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function categorySlug(category, subcategory) {
  const c = toSlug(String(category || '').trim());
  const s = toSlug(String(subcategory || '').trim());
  if (!c) return s || 'uncategorized';
  if (!s) return c;
  return `${c}-${s}`;
}

function safePrice(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim().replace(/[$,\s]/g, '');
  const n = parseFloat(s);
  if (Number.isNaN(n) || n < 0) return null;
  return Number(n.toFixed(2));
}

function randomBarcode12() {
  let s = '';
  for (let i = 0; i < 12; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// ---- Column index map (case-insensitive) ----
function buildColumnMap(headerRow) {
  const map = {};
  const norm = (h) => (typeof h === 'string' ? h.trim().toLowerCase() : '');
  headerRow.forEach((h, i) => {
    const k = norm(h);
    if (!map[k]) map[k] = i;
  });
  const get = (...names) => {
    for (const n of names) {
      const idx = map[n.toLowerCase()];
      if (idx !== undefined) return idx;
    }
    return -1;
  };
  return {
    category: get('category'),
    subcategory: get('subcategory'),
    product_name: get('product_name', 'product name'),
    price_usd: get('price_usd', 'price usd', 'price'),
  };
}

// ---- Main transform ----
function transform() {
  let raw;
  try {
    raw = fs.readFileSync(INPUT_FILE, 'utf8');
  } catch (e) {
    console.error('Input file not found:', INPUT_FILE);
    process.exit(1);
  }

  const rows = parseCSV(raw);
  if (rows.length < 2) {
    console.error('CSV must have header + at least one data row.');
    process.exit(1);
  }

  const header = rows[0];
  const col = buildColumnMap(header);
  const dataRows = rows.slice(1);

  const outHeader = [
    'name',
    'slug',
    'description',
    'price',
    'cost_price',
    'category_slug',
    'image_url',
    'barcode',
    'plu',
    'sku',
    'stock_quantity',
    'low_stock_threshold',
    'tax_rate',
    'is_active',
  ];

  const seenSlugs = new Set();
  const outRows = [];
  let skuCounter = 1;
  const usedBarcodes = new Set();

  for (const row of dataRows) {
    const get = (idx) => (idx >= 0 && row[idx] !== undefined ? String(row[idx]).trim() : '');
    const name = get(col.product_name);
    if (!name) continue; // skip empty names

    const price = safePrice(col.price_usd >= 0 ? row[col.price_usd] : null);
    if (price === null) continue; // invalid price

    const category = get(col.category);
    const subcategory = get(col.subcategory);
    const catSlug = categorySlug(category || 'Uncategorized', subcategory);

    let slug = toSlug(name);
    if (!slug) continue;
    const baseSlug = slug;
    let n = 1;
    while (seenSlugs.has(slug)) {
      n += 1;
      slug = n === 2 ? baseSlug + '-2' : baseSlug + '-' + n;
    }
    seenSlugs.add(slug);

    let barcode = randomBarcode12();
    while (usedBarcodes.has(barcode)) barcode = randomBarcode12();
    usedBarcodes.add(barcode);

    const sku = `EDI-${String(skuCounter++).padStart(4, '0')}`;

    outRows.push([
      escapeCsv(name),
      escapeCsv(slug),
      '', // description → NULL
      price.toFixed(2),
      '0.00',
      escapeCsv(catSlug),
      '', // image_url → NULL
      barcode,
      '', // plu → NULL
      sku,
      '0',
      '5',
      '0',
      '1',
    ]);
  }

  const outLines = [outHeader.join(',')].concat(outRows.map((r) => r.join(',')));
  fs.writeFileSync(OUTPUT_FILE, outLines.join('\n'), 'utf8');
  console.log('Wrote', outRows.length, 'rows to', OUTPUT_FILE);
}

transform();
