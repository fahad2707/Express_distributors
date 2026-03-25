/**
 * CLI: assign categories from final csv.csv (same logic as POST /products/assign-categories-csv).
 *
 *   cd backend && MONGODB_URI="..." npx tsx src/db/assignCategoriesFromFinalCsv.ts
 *   FINAL_CSV_PATH=/path/to.csv DRY_RUN=1 npx tsx src/db/assignCategoriesFromFinalCsv.ts
 */
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { assignCategoriesFromCsvRows, type CsvAssignRow } from '../services/categoryAssignmentFromCsv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const repoRoot = path.resolve(__dirname, '../../..');
const defaultCsv = path.join(repoRoot, 'final csv.csv');

async function main() {
  const csvPath = process.env.FINAL_CSV_PATH?.trim() || defaultCsv;
  const dryRun = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run');

  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found:', csvPath);
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const text = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as CsvAssignRow[];

  const result = await assignCategoriesFromCsvRows(rows, dryRun);
  console.log(JSON.stringify(result, null, 2));
  console.log('dryRun:', dryRun);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
