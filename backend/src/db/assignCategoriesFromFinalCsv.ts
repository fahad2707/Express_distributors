/**
 * CLI: assign categories from a master CSV (name, slug, category_slug, sku, …).
 *
 *   cd backend && MONGODB_URI="..." npx tsx src/db/assignCategoriesFromFinalCsv.ts
 *   FINAL_CSV_PATH=/path/to.csv DRY_RUN=1 npx tsx src/db/assignCategoriesFromFinalCsv.ts
 */
import fs from 'fs';
import path from 'path';
import { parseCsvRecords } from '../utils/csvParseRecords';
import mongoose from 'mongoose';
import connectDB from './connection';
import { assignCategoriesFromCsvRows, type CsvAssignRow } from '../services/categoryAssignmentFromCsv';

const repoRoot = path.resolve(__dirname, '../../..');
const defaultCsv = path.join(repoRoot, 'final csv.csv');

async function main() {
  const csvPath = process.env.FINAL_CSV_PATH?.trim() || defaultCsv;
  const dryRun = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found:', csvPath);
    process.exit(1);
  }

  if (!process.env.MONGODB_URI?.trim()) {
    console.error('Set MONGODB_URI in backend/.env (and MONGODB_DB_NAME if your data is not in the URI path).');
    process.exit(1);
  }

  await connectDB();
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = await parseCsvRecords<CsvAssignRow>(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const result = await assignCategoriesFromCsvRows(rows, dryRun);
  console.log(JSON.stringify(result, null, 2));
  console.log('dryRun:', dryRun);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
