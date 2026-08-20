// server/src/models/WithdrawRequest.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWithdrawRequest extends Document {
  userId: Types.ObjectId;
  userName: string;
  xuAmount: number;
  vndAmount: number;         // xuAmount * 10000
  feeVnd: number;            // 10% fee
  payoutVnd: number;         // vndAmount - feeVnd
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawRequestSchema = new Schema<IWithdrawRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true },
  xuAmount: { type: Number, required: true, min: 1 },
  vndAmount: { type: Number, required: true },
  feeVnd: { type: Number, required: true },
  payoutVnd: { type: Number, required: true },
  bankName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountHolder: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  adminNote: { type: String },
}, {
  timestamps: true,
});

export const WithdrawRequest = mongoose.model<IWithdrawRequest>('WithdrawRequest', WithdrawRequestSchema);
