/**
 * Map retail barcodes from an Excel file onto Product.sku and Product.barcode.
 *
 * The sheet is expected to have a product name column and a barcode/UPC column
 * (headers are auto-detected). Rows are matched to the DB by:
 * 1) MongoDB _id if the sheet has a matching id column, else
 * 2) exact normalized name (one unique product in DB required per row).
 *
 *   cd backend
 *   SKU_EXCEL_PATH="/path/to/Asif badat.xlsx" npx tsx src/db/apply-sku-barcode-from-excel.ts
 *   SKU_EXCEL_PATH="..." npx tsx src/db/apply-sku-barcode-from-excel.ts --apply
 */
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import mongoose from 'mongoose';
import connectDB from './connection';
import Product from '../models/Product';

function normName(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/[.,/#]+$/g, '')
    .trim();
}

function normCode(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/^\s+|\s+$/g, '')
    .replace(/\.0+$/g, '');
}

function hasRealCode(v: string): boolean {
  const t = normCode(v);
  if (!t) return false;
  return /[0-9]/.test(t) || (t.length >= 4 && /^[a-z0-9-]+$/i.test(t));
}

type ColMap = { nameIdx: number | null; codeIdx: number; idIdx: number | null };

function lowerHeader(c: unknown): string {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/\u00a0/g, ' ');
}

function scoreName(i: number, cells: string[]): number {
  const h = cells[i];
  if (!h) return 0;
  if (/_?id$|mongo|objectid|service id/.test(h) && !/name|code|item name/.test(h)) return 0;
  if (h === 'name' || h === 'item' || h === 'item name' || h === 'product' || h === 'product name') return 5;
  if (h === 'description' && !h.includes('cat')) return 3;
  if (h.includes('name') && !h.includes('category') && !h.includes('vendor')) return 2;
  return 0;
}

function scoreCode(i: number, cells: string[], nameIdx: number | null): number {
  if (nameIdx != null && i === nameIdx) return 0;
  const h = cells[i];
  if (!h) return 0;
  if (h.includes('name') && !/upc|code|bar|sku|plu|ean|#/.test(h)) return 0;
  if (/^barcode$|^upc$|^ean$|^gtin$|^\s*plu\s*$|item.*#|item.*code|bar\s*code|scancode|code128|item no|itm/.test(h))
    return 5;
  if (h === 'code' && !/cat|vendor|tax/.test(h)) return 4;
  if (h === 'sku' || h === 'scancode' || h.endsWith(' sku') || h.startsWith('sku ')) return 4;
  if (h.includes('upc') || h.includes('barcode')) return 3;
  if (h === 'id' || h === 'item id' || h === 'item#') return 1;
  return 0;
}

function findIdColumn(cells: string[]): number | null {
  for (let i = 0; i < cells.length; i++) {
    const h = cells[i];
    if (h === 'mongodb_id' || h === 'mongo_id' || h === '_id' || h === 'objectid' || h === 'id (mongo)') {
      return i;
    }
  }
  return null;
}

function detectColumns(headerRow: unknown[]): ColMap | null {
  if (!headerRow || !headerRow.length) return null;
  const cells = headerRow.map(lowerHeader);
  const idIdx = findIdColumn(cells);

  let nameIdx: number | null = null;
  let nameBest = 0;
  for (let i = 0; i < cells.length; i++) {
    const s = scoreName(i, cells);
    if (s > nameBest) {
      nameBest = s;
      nameIdx = i;
    }
  }
  if (nameBest === 0) {
    nameIdx = null;
  }

  let codeIdx = -1;
  let codeBest = 0;
  for (let i = 0; i < cells.length; i++) {
    if (i === (idIdx ?? -2)) continue;
    const s = scoreCode(i, cells, nameIdx);
    if (s > codeBest) {
      codeBest = s;
      codeIdx = i;
    }
  }
  if (codeIdx < 0) return null;
  if (!nameIdx && idIdx == null) return null;

  return { nameIdx, codeIdx, idIdx: idIdx };
}

async function main() {
  const argPath = process.argv.find((a) => a.startsWith('--file='))?.replace('--file=', '');
  const filePath = (process.env.SKU_EXCEL_PATH || argPath || path.join(__dirname, '../../../Asif badat.xlsx'))
    .trim();
  const apply = process.argv.includes('--apply');
  const headerRow0 = Math.max(0, parseInt(process.env.SHEET_HEADER_ROW || '0', 10) || 0);
  const sheetName = (process.env.SHEET_NAME || '').trim() || null;

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    console.error('Set SKU_EXCEL_PATH or: npx tsx src/db/apply-sku-barcode-from-excel.ts --file="/full/path/Asif badat.xlsx"');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI?.trim()) {
    console.error('Set MONGODB_URI in .env (and MONGODB_DB_NAME if needed).');
    process.exit(1);
  }

  const buf = fs.readFileSync(filePath);
  const wb = xlsx.read(buf, { type: 'buffer' });
  const sName = sheetName || wb.SheetNames[0]!;
  const sh = wb.Sheets[sName];
  if (!sh) {
    console.error('Sheet not found:', sName, '— available:', wb.SheetNames.join(', '));
    process.exit(1);
  }
  const rows = xlsx.utils.sheet_to_json<unknown[]>(sh, { header: 1, defval: '' });
  if (rows.length <= headerRow0 + 1) {
    console.error('Not enough rows in sheet');
    process.exit(1);
  }
  const header = rows[headerRow0] as unknown[];
  const col = detectColumns(header);
  if (!col) {
    console.error('Could not detect name + barcode columns. Headers were:', header);
    process.exit(1);
  }
  console.log('Using sheet:', sName, '| name column index:', col.nameIdx, '| code column:', col.codeIdx, '| _id column:', col.idIdx);

  await connectDB();
  const products = await Product.find({})
    .select('_id name sku barcode plu')
    .lean();
  const byName = new Map<string, (typeof products)[0][]>();
  for (const p of products) {
    const n = normName(p.name);
    if (!n) continue;
    const a = byName.get(n) || [];
    a.push(p);
    byName.set(n, a);
  }

  let updated = 0;
  const skipped: string[] = [];
  const errors: string[] = [];
  const would: { row: number; productId: string; name: string; old: { sku?: string; bar?: string }; newCode: string }[] = [];
  /** Reject the same name / same _id twice in the file with two different barcodes. */
  const sheetNameToCode = new Map<string, string>();
  const sheetIdToCode = new Map<string, string>();

  for (let r = headerRow0 + 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
    if (!row || !row.length) continue;
    const get = (i: number | null) => (i == null ? '' : normCode(String(row[i] ?? '')));
    const nameCell = get(col.nameIdx);
    const code = normCode(String(row[col.codeIdx] ?? ''));
    const idCell = get(col.idIdx);
    if (!hasRealCode(code)) {
      skipped.push(`row ${r + 1}: no barcode / code cell`);
      continue;
    }
    if (!nameCell && !idCell) {
      skipped.push(`row ${r + 1}: no name and no id`);
      continue;
    }
    if (idCell && /^[a-f0-9]{24}$/i.test(idCell)) {
      const prior = sheetIdToCode.get(idCell);
      if (prior && prior !== code) {
        errors.push(
          `row ${r + 1}: duplicate Mongo _id in the sheet with two different barcodes (${prior} vs ${code})`
        );
        continue;
      }
      sheetIdToCode.set(idCell, code);
    } else if (nameCell) {
      const nKey = normName(nameCell);
      if (nKey) {
        const prior = sheetNameToCode.get(nKey);
        if (prior && prior !== code) {
          errors.push(
            `row ${r + 1}: duplicate name in the sheet with two different barcodes ("${nameCell}": ${prior} vs ${code})`
          );
          continue;
        }
        sheetNameToCode.set(nKey, code);
      }
    }

    let match: (typeof products)[0] | null = null;
    if (idCell && /^[a-f0-9]{24}$/i.test(idCell)) {
      match = products.find((p) => String(p._id) === idCell) || null;
      if (!match) {
        errors.push(`row ${r + 1}: _id not in database: ${idCell}`);
        continue;
      }
    } else {
      if (!nameCell) {
        skipped.push(`row ${r + 1}: no name for non-_id match`);
        continue;
      }
      const nn = normName(nameCell);
      const cands = byName.get(nn) || [];
      if (cands.length === 0) {
        errors.push(`row ${r + 1}: no product named like "${nameCell}"`);
        continue;
      }
      if (cands.length > 1) {
        errors.push(
          `row ${r + 1}: ambiguous name "${nameCell}" (${cands.length} products; ids: ${cands
            .map((p) => String(p._id))
            .join(', ')}) — fix sheet or disambiguate with a Mongo _id column`
        );
        continue;
      }
      match = cands[0]!;
    }

    const otherSku = await Product.findOne({ _id: { $ne: match._id }, $or: [{ sku: code }, { barcode: code }] }).lean();
    if (otherSku) {
      errors.push(
        `row ${r + 1}: code "${code}" already on another product (id: ${(otherSku as { _id: { toString: () => string } })._id.toString()})`
      );
      continue;
    }
    if (String(match.sku) === code && String(match.barcode) === code) {
      skipped.push(`row ${r + 1}: product ${String(match._id)} already has sku/barcode = ${code}`);
      continue;
    }

    would.push({
      row: r + 1,
      productId: String(match._id),
      name: match.name,
      old: { sku: match.sku, bar: match.barcode },
      newCode: code,
    });
    if (apply) {
      try {
        await Product.updateOne(
          { _id: match._id },
          { $set: { sku: code, barcode: code, updated_at: new Date() } }
        );
        updated++;
      } catch (e) {
        errors.push(`row ${r + 1} update error: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  console.log('\n--- Plan (use --apply to write) ---');
  console.log(JSON.stringify(would.slice(0, 80), null, 2));
  if (would.length > 80) console.log(`... and ${would.length - 80} more changes`);
  console.log('\nSummary: planned updates:', would.length, '| applied:', apply ? updated : 0, '| dry run:', !apply);
  if (errors.length) {
    console.log('\nErrors / blocked:', errors.length);
    for (const e of errors.slice(0, 40)) console.log(' ', e);
    if (errors.length > 40) console.log('  ...', errors.length - 40, 'more');
  }
  if (skipped.length) {
    console.log('\nSkipped (info):', Math.min(15, skipped.length), 'of', skipped.length);
    for (const s of skipped.slice(0, 15)) console.log(' ', s);
  }
  if (!apply && would.length) {
    console.log('\n-> Re-run with --apply after reviewing the list above.\n');
  }
  await mongoose.disconnect();
  if (apply && would.length > 0 && updated < would.length) {
    process.exit(1);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
