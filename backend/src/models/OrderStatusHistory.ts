import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderStatusHistory extends Document {
  order_id: mongoose.Types.ObjectId;
  status: string;
  notes?: string;
  created_at: Date;
}

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    status: { type: String, required: true },
    notes: String,
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

OrderStatusHistorySchema.index({ order_id: 1 });

export default mongoose.model<IOrderStatusHistory>('OrderStatusHistory', OrderStatusHistorySchema);




