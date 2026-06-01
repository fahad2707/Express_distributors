/**
 * Run: npm run db:backfill-product-codes
 * Migrates all products: long UPC → sku, assigns permanent 5-digit product_id, clears legacy barcode/plu.
 */
import connectDB from './connection';
import { migrateProductIdAndSku } from '../utils/productCodes';

async function main() {
  await connectDB();
  const r = await migrateProductIdAndSku();
  console.log('Migration result:', JSON.stringify(r, null, 2));
  if (r.warnings.length) {
    console.warn('Warnings (first 20):', r.warnings.slice(0, 20));
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
