import mongoose, { Schema, Document } from 'mongoose';

export interface ILedgerEntry extends Document {
  date: Date;
  account_type: string;
  party_type?: 'VENDOR' | 'CUSTOMER';
  party_id?: mongoose.Types.ObjectId;
  debit: number;
  credit: number;
  reference_type: string;
  reference_id: mongoose.Types.ObjectId;
  description?: string;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
  {
    date: { type: Date, required: true, default: Date.now },
    account_type: { type: String, required: true },
    party_type: { type: String, enum: ['VENDOR', 'CUSTOMER'] },
    party_id: { type: Schema.Types.ObjectId },
    debit: { type: Number, required: true, default: 0 },
    credit: { type: Number, required: true, default: 0 },
    reference_type: { type: String, required: true },
    reference_id: { type: Schema.Types.ObjectId, required: true },
    description: String,
    created_by: { type: Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

LedgerEntrySchema.index({ date: 1 });
LedgerEntrySchema.index({ party_type: 1, party_id: 1 });
LedgerEntrySchema.index({ reference_type: 1, reference_id: 1 });
LedgerEntrySchema.index({ account_type: 1 });

export default mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
