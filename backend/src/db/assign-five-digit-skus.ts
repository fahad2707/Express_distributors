/**
 * Assign a unique 5-digit SKU (10000–99999) to products in MongoDB.
 *
 * Uses MONGODB_URI (+ optional MONGODB_DB_NAME) from backend/.env — point this
 * at the **same database** your deployed site uses (e.g. Atlas) so IDs match production.
 *
 * Usage:
 *   npm run db:assign-five-digit-skus -- --dry-run
 *   npm run db:assign-five-digit-skus
 *   npm run db:assign-five-digit-skus -- --force
 *
 * Modes:
 *   (default)  Only products missing SKU, non–5-digit SKU, or duplicate SKU get a new code.
 *   --force     Every product gets a new 5-digit SKU (breaks old POS labels that used the old code).
 */
import connectDB from './connection';
import { assignFiveDigitSkus } from '../utils/assignFiveDigitSkus';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const force = argv.includes('--force');

async function main() {
  await connectDB();
  const mode = force ? 'all' : 'fill-gaps';
  console.log(`Mode: ${mode}${dryRun ? ' (dry-run)' : ''}`);

  const r = await assignFiveDigitSkus({ mode, dryRun });

  console.log(`Examined: ${r.examined}`);
  console.log(`Kept existing 5-digit SKU: ${r.kept}`);
  console.log(`Products ${dryRun ? 'would be' : ''} assigned new SKU: ${r.toAssign}`);
  if (!dryRun) console.log(`Updated in DB: ${r.updated}`);

  const show = r.assignments.slice(0, 40);
  if (show.length) {
    console.log(dryRun ? '\nSample (first 40):' : '\nFirst 40 assignments:');
    show.forEach((a) => console.log(`  ${a.productId}  ${a.oldSku} → ${a.newSku}`));
    if (r.assignments.length > 40) console.log(`  … and ${r.assignments.length - 40} more`);
  }

  if (r.warnings.length) {
    console.warn('\nWarnings (first 30):');
    r.warnings.slice(0, 30).forEach((w) => console.warn(' ', w));
    if (r.warnings.length > 30) console.warn(`  … and ${r.warnings.length - 30} more`);
  }

  if (dryRun) {
    console.log('\nRe-run without --dry-run to write changes.');
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
