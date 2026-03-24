import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseCategory extends Document {
  name: string;
  type: 'FIXED' | 'VARIABLE';
  color_tag?: string;
  created_at: Date;
  updated_at: Date;
}

const ExpenseCategorySchema = new Schema<IExpenseCategory>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['FIXED', 'VARIABLE'], default: 'VARIABLE' },
    color_tag: { type: String, default: '#6b7280' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

ExpenseCategorySchema.index({ name: 1 });
ExpenseCategorySchema.index({ type: 1 });

export default mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);
