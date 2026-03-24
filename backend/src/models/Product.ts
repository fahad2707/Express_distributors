import mongoose, { Schema, Document } from 'mongoose';

export type ProductType = 'inventory' | 'non_inventory' | 'service';

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  product_type: ProductType; // inventory (stock tracked), non_inventory (e.g. fees), service
  price: number;
  cost_price?: number; // Hidden from staff, for profit calculation
  category_id?: mongoose.Types.ObjectId;
  sub_category_id?: mongoose.Types.ObjectId;
  image_url?: string;
  barcode?: string;
  plu?: string; // Price Look-Up code for non-barcode items
  sku?: string; // Stock Keeping Unit
  stock_quantity: number;
  committed_quantity: number; // Reserved by open orders (available = stock_quantity - committed_quantity)
  low_stock_threshold: number;
  reorder_point?: number; // Alert when stock falls below (for purchasing)
  vendor_id?: mongoose.Types.ObjectId; // Primary vendor for this product
  is_active: boolean;
  tax_rate?: number; // Tax percentage (e.g., 8.5 for 8.5%)
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    product_type: { type: String, enum: ['inventory', 'non_inventory', 'service'], default: 'inventory' },
    price: { type: Number, required: true },
    cost_price: Number, // Hidden from staff
    category_id: { type: Schema.Types.ObjectId, ref: 'Category' },
    sub_category_id: { type: Schema.Types.ObjectId, ref: 'SubCategory' },
    image_url: String,
    barcode: { type: String, unique: true, sparse: true },
    plu: { type: String, unique: true, sparse: true }, // PLU code
    sku: { type: String, unique: true, sparse: true }, // SKU
    stock_quantity: { type: Number, default: 0 },
    committed_quantity: { type: Number, default: 0 }, // Reserved by open orders
    low_stock_threshold: { type: Number, default: 10 },
    reorder_point: Number,
    vendor_id: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    is_active: { type: Boolean, default: true },
    tax_rate: { type: Number, default: 0 }, // Tax percentage
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

ProductSchema.index({ category_id: 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
