import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  type: 'sale' | 'refund' | 'vendor' | 'expense' | 'adjustment';
  amount: number; // positive = income, negative = refund/expense
  method: 'cash' | 'card' | 'check' | 'digital' | 'other';
  reference?: string; // check number, transaction id
  sale_id?: mongoose.Types.ObjectId;
  order_id?: mongoose.Types.ObjectId;
  vendor_id?: mongoose.Types.ObjectId;
  purchase_order_id?: mongoose.Types.ObjectId;
  notes?: string;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    type: { type: String, enum: ['sale', 'refund', 'vendor', 'expense', 'adjustment'], required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['cash', 'card', 'check', 'digital', 'other'], required: true },
    reference: String,
    sale_id: { type: Schema.Types.ObjectId, ref: 'POSSale' },
    order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
    vendor_id: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    purchase_order_id: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    notes: String,
    created_by: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

PaymentSchema.index({ type: 1 });
PaymentSchema.index({ sale_id: 1 });
PaymentSchema.index({ vendor_id: 1 });
PaymentSchema.index({ created_at: -1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
