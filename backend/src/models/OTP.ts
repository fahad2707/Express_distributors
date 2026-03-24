import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  phone: string;
  code: string;
  expires_at: Date;
  verified: boolean;
  created_at: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    phone: { type: String, required: true },
    code: { type: String, required: true },
    expires_at: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Index for faster lookups
OTPSchema.index({ phone: 1, expires_at: 1 });

export default mongoose.model<IOTP>('OTP', OTPSchema);




