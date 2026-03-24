import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement extends Document {
  product_id: mongoose.Types.ObjectId;
  movement_type: string;
  quantity_change: number;
  reference_type?: string;
  reference_id?: mongoose.Types.ObjectId;
  notes?: string;
  admin_id?: mongoose.Types.ObjectId;
  created_at: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    movement_type: { type: String, required: true },
    quantity_change: { type: Number, required: true },
    reference_type: String,
    reference_id: Schema.Types.ObjectId,
    notes: String,
    admin_id: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

StockMovementSchema.index({ product_id: 1 });

export default mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);




