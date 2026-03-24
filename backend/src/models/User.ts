import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phone?: string;
  name?: string;
  email?: string;
  password_hash?: string;
  email_verified: boolean;
  email_verification_token_hash?: string;
  email_verification_expires?: Date;
  password_reset_token_hash?: string;
  password_reset_expires?: Date;
  loyalty_points: number;
  total_spent: number;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, unique: true, sparse: true },
    name: String,
    email: String,
    password_hash: String,
    email_verified: { type: Boolean, default: true },
    email_verification_token_hash: String,
    email_verification_expires: Date,
    password_reset_token_hash: String,
    password_reset_expires: Date,
    loyalty_points: { type: Number, default: 0 },
    total_spent: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default mongoose.model<IUser>('User', UserSchema);
