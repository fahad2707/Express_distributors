import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  admin_id?: mongoose.Types.ObjectId;
  action: string; // e.g. price_change, stock_adjust, sale_void, refund, product_create, customer_update
  entity_type: string; // e.g. Product, POSSale, Order, Customer, Return
  entity_id: string;
  old_value?: Record<string, unknown>; // snapshot before change
  new_value?: Record<string, unknown>; // snapshot after change
  details?: string; // optional human-readable note
  ip?: string;
  created_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin_id: { type: Schema.Types.ObjectId, ref: 'Admin' },
    action: { type: String, required: true },
    entity_type: { type: String, required: true },
    entity_id: { type: String, required: true },
    old_value: Schema.Types.Mixed,
    new_value: Schema.Types.Mixed,
    details: String,
    ip: String,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

AuditLogSchema.index({ entity_type: 1, entity_id: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ created_at: -1 });
AuditLogSchema.index({ admin_id: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
