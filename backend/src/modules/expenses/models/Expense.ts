import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  expense_number: string;
  date: Date;
  /** Free-text expense type (e.g. Electricity, WiFi, Shipping, Transport, Manpower) — not product category */
  expense_type: string;
  description?: string;
  amount: number;
  payment_mode: 'CASH' | 'BANK' | 'UPI' | 'CARD';
  vendor_name?: string;
  attachment?: string;
  is_recurring: boolean;
  recurrence_type: 'MONTHLY' | 'YEARLY' | 'NONE';
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date; // soft delete
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expense_number: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    expense_type: { type: String, required: true, trim: true },
    description: String,
    amount: { type: Number, required: true, min: 0 },
    payment_mode: { type: String, enum: ['CASH', 'BANK', 'UPI', 'CARD'], required: true },
    vendor_name: String,
    attachment: String,
    is_recurring: { type: Boolean, default: false },
    recurrence_type: { type: String, enum: ['MONTHLY', 'YEARLY', 'NONE'], default: 'NONE' },
    created_by: { type: Schema.Types.ObjectId, ref: 'Admin' },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ expense_type: 1 });
ExpenseSchema.index({ payment_mode: 1 });
ExpenseSchema.index({ deleted_at: 1 });
ExpenseSchema.index({ is_recurring: 1, recurrence_type: 1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
