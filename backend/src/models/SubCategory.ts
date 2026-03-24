import mongoose, { Schema, Document } from 'mongoose';

export interface ISubCategory extends Document {
  name: string;
  slug: string;
  category_id: mongoose.Types.ObjectId;
  description?: string;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

const SubCategorySchema = new Schema<ISubCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    category_id: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: String,
    display_order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

SubCategorySchema.index({ category_id: 1 });
SubCategorySchema.index({ slug: 1, category_id: 1 }, { unique: true });

export default mongoose.model<ISubCategory>('SubCategory', SubCategorySchema);
