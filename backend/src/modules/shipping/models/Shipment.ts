import mongoose, { Schema, Document } from 'mongoose';

export interface IShipmentItem {
  product_id: mongoose.Types.ObjectId;
  product_name?: string;
  quantity: number;
  status: 'PENDING' | 'PICKED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'RETURNED';
}

export interface IShipment extends Document {
  shipment_number: string;
  shipment_type: 'GROUND' | 'GROUND_RG';
  linked_invoice_id?: mongoose.Types.ObjectId;
  linked_return_request_id?: mongoose.Types.ObjectId;
  warehouse_id?: mongoose.Types.ObjectId;
  transporter_name?: string;
  vehicle_number?: string;
  lr_number?: string;
  dispatch_date?: Date;
  expected_delivery_date?: Date;
  delivered_date?: Date;
  freight_charge: number;
  status: 'PENDING' | 'PACKED' | 'DISPATCHED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'RETURNED';
  proof_of_delivery_url?: string;
  weight_kg?: number;
  volume_cbm?: number;
  notes?: string;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
  items: IShipmentItem[];
}

const ShipmentItemSchema = new Schema<IShipmentItem>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    product_name: String,
    quantity: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'PICKED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'RETURNED'], default: 'PENDING' },
  },
  { _id: true }
);

const ShipmentSchema = new Schema<IShipment>(
  {
    shipment_number: { type: String, required: true, unique: true },
    shipment_type: { type: String, enum: ['GROUND', 'GROUND_RG'], required: true },
    linked_invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    linked_return_request_id: { type: Schema.Types.ObjectId },
    warehouse_id: { type: Schema.Types.ObjectId },
    transporter_name: String,
    vehicle_number: String,
    lr_number: String,
    dispatch_date: Date,
    expected_delivery_date: Date,
    delivered_date: Date,
    freight_charge: { type: Number, default: 0 },
    status: { type: String, enum: ['PENDING', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'], default: 'PENDING' },
    proof_of_delivery_url: String,
    weight_kg: Number,
    volume_cbm: Number,
    notes: String,
    created_by: { type: Schema.Types.ObjectId, ref: 'Admin' },
    items: [ShipmentItemSchema],
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

ShipmentSchema.index({ shipment_type: 1 });
ShipmentSchema.index({ status: 1 });
ShipmentSchema.index({ linked_invoice_id: 1 });
ShipmentSchema.index({ dispatch_date: -1 });
ShipmentSchema.index({ created_at: -1 });

export default mongoose.model<IShipment>('Shipment', ShipmentSchema);
