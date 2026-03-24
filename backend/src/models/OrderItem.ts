import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem extends Document {
  order_id: mongoose.Types.ObjectId;
  product_id?: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

OrderItemSchema.index({ order_id: 1 });

export default mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);




