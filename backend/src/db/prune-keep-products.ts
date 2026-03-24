/**
 * Prune database while keeping products and their required references.
 *
 * Keeps:
 * - Products
 * - Categories referenced by products
 * - Sub-categories referenced by products
 * - Vendors referenced by products
 * - Admin users
 *
 * Deletes all other operational/test data so you can start fresh.
 */
import mongoose from 'mongoose';
import connectDB from './connection';
import Admin from '../models/Admin';
import AuditLog from '../models/AuditLog';
import BankAccount from '../models/BankAccount';
import Category from '../models/Category';
import CreditMemo from '../modules/credit-memo/models/CreditMemo';
import Customer from '../models/Customer';
import Expense from '../modules/expenses/models/Expense';
import ExpenseCategory from '../modules/expenses/models/ExpenseCategory';
import Invoice from '../models/Invoice';
import LedgerEntry from '../models/LedgerEntry';
import Order from '../models/Order';
import OrderItem from '../models/OrderItem';
import OrderStatusHistory from '../models/OrderStatusHistory';
import OTP from '../models/OTP';
import Payment from '../models/Payment';
import PaymentMethod from '../models/PaymentMethod';
import POSSale from '../models/POSSale';
import Product from '../models/Product';
import PurchaseOrder from '../models/PurchaseOrder';
import Receipt from '../models/Receipt';
import Return from '../models/Return';
import Shipment from '../modules/shipping/models/Shipment';
import StockMovement from '../models/StockMovement';
import StoreSettings from '../models/StoreSettings';
import SubCategory from '../models/SubCategory';
import TaxType from '../models/TaxType';
import User from '../models/User';
import Vendor from '../models/Vendor';

type DelModel = { deleteMany: (filter?: object) => Promise<{ deletedCount: number }> };

const DELETE_COLLECTIONS: { name: string; model: DelModel }[] = [
  { name: 'CreditMemos', model: CreditMemo },
  { name: 'Invoices', model: Invoice },
  { name: 'Receipts', model: Receipt },
  { name: 'OrderItems', model: OrderItem },
  { name: 'OrderStatusHistories', model: OrderStatusHistory },
  { name: 'Orders', model: Order },
  { name: 'PurchaseOrders', model: PurchaseOrder },
  { name: 'Expenses', model: Expense },
  { name: 'ExpenseCategories', model: ExpenseCategory },
  { name: 'Shipments', model: Shipment },
  { name: 'StockMovements', model: StockMovement },
  { name: 'Payments', model: Payment },
  { name: 'LedgerEntries', model: LedgerEntry },
  { name: 'Returns', model: Return },
  { name: 'POSSales', model: POSSale },
  { name: 'AuditLogs', model: AuditLog },
  { name: 'Customers', model: Customer },
  { name: 'BankAccounts', model: BankAccount },
  { name: 'TaxTypes', model: TaxType },
  { name: 'PaymentMethods', model: PaymentMethod },
  { name: 'StoreSettings', model: StoreSettings },
  { name: 'OTPs', model: OTP },
  { name: 'Users', model: User },
];

function toIdSet(values: unknown[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    if (!v) continue;
    try {
      set.add(String(v));
    } catch {
      // ignore invalid value
    }
  }
  return [...set];
}

async function run() {
  console.log('Connecting to MongoDB...');
  await connectDB();

  const products = await Product.find({}, { category_id: 1, sub_category_id: 1, vendor_id: 1 }).lean();
  const keepProductCount = products.length;

  const keepCategoryIds = toIdSet(products.map((p: any) => p.category_id));
  const keepSubCategoryIds = toIdSet(products.map((p: any) => p.sub_category_id));
  const keepVendorIds = toIdSet(products.map((p: any) => p.vendor_id));

  console.log(`Keeping products: ${keepProductCount}`);
  console.log(`Keeping categories referenced by products: ${keepCategoryIds.length}`);
  console.log(`Keeping sub-categories referenced by products: ${keepSubCategoryIds.length}`);
  console.log(`Keeping vendors referenced by products: ${keepVendorIds.length}`);

  console.log('\nDeleting non-product collections...');
  for (const { name, model } of DELETE_COLLECTIONS) {
    const result = await model.deleteMany({});
    console.log(`  ${name}: ${result.deletedCount} deleted`);
  }

  const categoryFilter = keepCategoryIds.length
    ? { _id: { $nin: keepCategoryIds.map((id) => new mongoose.Types.ObjectId(id)) } }
    : {};
  const subCategoryFilter = keepSubCategoryIds.length
    ? { _id: { $nin: keepSubCategoryIds.map((id) => new mongoose.Types.ObjectId(id)) } }
    : {};
  const vendorFilter = keepVendorIds.length
    ? { _id: { $nin: keepVendorIds.map((id) => new mongoose.Types.ObjectId(id)) } }
    : {};

  const deletedSub = await SubCategory.deleteMany(subCategoryFilter);
  const deletedCat = await Category.deleteMany(categoryFilter);
  const deletedVendors = await Vendor.deleteMany(vendorFilter);

  console.log('\nPruned reference collections (kept items tied to products):');
  console.log(`  SubCategories deleted: ${deletedSub.deletedCount}`);
  console.log(`  Categories deleted: ${deletedCat.deletedCount}`);
  console.log(`  Vendors deleted: ${deletedVendors.deletedCount}`);

  const finalProducts = await Product.countDocuments({});
  const finalCategories = await Category.countDocuments({});
  const finalSubCategories = await SubCategory.countDocuments({});
  const finalAdmins = await Admin.countDocuments({});
  console.log('\nFinal counts:');
  console.log(`  Products: ${finalProducts}`);
  console.log(`  Categories: ${finalCategories}`);
  console.log(`  SubCategories: ${finalSubCategories}`);
  console.log(`  Admins: ${finalAdmins}`);
  console.log('\nDone.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Prune failed:', err);
  process.exit(1);
});

