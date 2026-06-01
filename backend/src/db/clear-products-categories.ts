import connectDB from './connection';
import Category from '../models/Category';
import CustomerProductPrice from '../models/CustomerProductPrice';
import Product from '../models/Product';
import SubCategory from '../models/SubCategory';

async function clearProductsAndCategories() {
  console.log('🔄 Connecting to MongoDB...');
  await connectDB();
  console.log('🗑️  Clearing Products, Categories, SubCategories, and customer product prices...\n');

  try {
    const cppRes = await CustomerProductPrice.deleteMany({});
    console.log(`  CustomerProductPrices: ${cppRes.deletedCount} document(s) deleted`);

    const prodRes = await Product.deleteMany({});
    console.log(`  Products: ${prodRes.deletedCount} document(s) deleted`);

    const catRes = await Category.deleteMany({});
    console.log(`  Categories: ${catRes.deletedCount} document(s) deleted`);

    const subRes = await SubCategory.deleteMany({});
    console.log(`  SubCategories: ${subRes.deletedCount} document(s) deleted`);
  } catch (err: any) {
    console.error(`ERROR - ${err.message}`);
  }

  console.log('\n✅ Products and categories cleared.');
  process.exit(0);
}

clearProductsAndCategories().catch((err) => {
  console.error('Failed to clear data:', err);
  process.exit(1);
});
