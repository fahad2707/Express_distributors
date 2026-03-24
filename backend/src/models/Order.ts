import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  product_id: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IOrder extends Document {
  order_number: string;
  user_id?: mongoose.Types.ObjectId;
  status: string;
  total_amount: number;
  payment_intent_id?: string;
  payment_status: string;
  pickup_location: string;
  created_at: Date;
  updated_at: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const OrderSchema = new Schema<IOrder>(
  {
    order_number: { type: String, required: true, unique: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'placed' },
    total_amount: { type: Number, required: true },
    payment_intent_id: String,
    payment_status: { type: String, default: 'pending' },
    pickup_location: { type: String, default: 'Store Pickup' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

OrderSchema.index({ user_id: 1 });
OrderSchema.index({ status: 1 });

export default mongoose.model<IOrder>('Order', OrderSchema);




