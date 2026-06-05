/**
 * Run: npm run db:backfill-product-codes
 * Migrates all products: long UPC → sku, assigns permanent 5-digit product_id, clears legacy barcode/plu.
 *
 * Uses backend/.env → MONGODB_URI (defaults to localhost). Production catalog (~1400+ products)
 * lives on Railway/Atlas — point MONGODB_URI at that cluster before running, or use
 * POST /api/products/backfill-codes on the live API (admin token required).
 */
import mongoose from 'mongoose';
import connectDB from './connection';
import Product from '../models/Product';
import { migrateProductIdAndSku } from '../utils/productCodes';

function maskMongoUri(uri: string): string {
  return uri.replace(/:([^:@/]+)@/, ':***@');
}

async function main() {
  await connectDB();
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/express_distributors';
  const total = await Product.countDocuments({});
  const missingId = await Product.countDocuments({
    $or: [{ product_id: { $exists: false } }, { product_id: null }, { product_id: '' }],
  });
  console.log('Connected to:', maskMongoUri(uri));
  console.log('Database name:', mongoose.connection.name);
  console.log('Product counts:', { total, missing_product_id: missingId });
  if (total < 100) {
    console.warn(
      '\n⚠️  Only',
      total,
      'products in this database. If you expect 1400+, your .env is likely pointing at local/dev MongoDB, not production.\n' +
        '   Copy MONGODB_URI (and MONGODB_DB_NAME if used) from Railway → your service → Variables, into backend/.env, then run again.\n'
    );
  }
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
