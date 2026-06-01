import path from 'path';
import mongoose from 'mongoose';
import { importCategoryXlsFiles } from './xlsCategoryImport';

/** Repo root: backend/src/db → ../../.. */
const REPO_ROOT = path.resolve(__dirname, '../../..');

const CATEGORY_XLS_FILES = [
  'automotive.xls',
  'beverages.xls',
  'Candy and Snacks.xls',
  'Clothing.xls',
  'Ecigarettes and Vaporizer.xls',
  'Electronics.xls',
  'Energy.xls',
  'General Merchandise.xls',
  'Grocery.xls',
  'Health and Beauty.xls',
  'Household Products.xls',
  'Kratom Products.xls',
  'nicotine pouches.xls',
  'Smoking Accessories.xls',
  'Snacks.xls',
  'Store Supplies.xls',
  'Tobacco.xls',
];

async function main() {
  const paths = CATEGORY_XLS_FILES.map((f) => path.join(REPO_ROOT, f));
  try {
    await importCategoryXlsFiles(paths);
  } catch (e) {
    console.error('Fatal error during import:', e);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
  process.exit(0);
}

main();
