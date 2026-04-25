/**
 * Run: npm run db:backfill-product-codes
 * Connects to MongoDB and fills empty SKU/barcode (see ../utils/productCodes.ts).
 */
import connectDB from './connection';
import { backfillProductSkuAndBarcode } from '../utils/productCodes';

async function main() {
  await connectDB();
  const r = await backfillProductSkuAndBarcode();
  console.log('Backfill result:', JSON.stringify(r, null, 2));
  if (r.warnings.length) {
    console.warn('Warnings (first 20):', r.warnings.slice(0, 20));
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
