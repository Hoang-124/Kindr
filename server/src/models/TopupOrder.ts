// server/src/models/TopupOrder.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type TopupStatus = 'pending' | 'completed' | 'cancelled' | 'expired';

export interface ITopupOrder extends Document {
  orderCode: string;          // Unique code, e.g., TOPUP_1741234567890
  userId: Types.ObjectId;
  userName: string;
  userPhone?: string;
  xuAmount: number;
  vndAmount: number;
  status: TopupStatus;
  memo: string;               // e.g. KINDR NAP 10XU TOPUP_123456
  vietqrUrl: string;
  bankName?: string;
  accountNumber?: string;
  transactionRef?: string;    // Bank transfer reference from Webhook IPN
  gatewayName?: string;       // sepay, casso, payos, manual, etc.
  rawWebhookPayload?: any;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TopupOrderSchema = new Schema<ITopupOrder>({
  orderCode: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true },
  userPhone: { type: String },
  xuAmount: { type: Number, required: true, min: 1 },
  vndAmount: { type: Number, required: true, min: 10000 },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'expired'],
    default: 'pending',
    index: true,
  },
  memo: { type: String, required: true },
  vietqrUrl: { type: String, required: true },
  bankName: { type: String, default: 'MBBank' },
  accountNumber: { type: String, default: '0905123456' },
  transactionRef: { type: String },
  gatewayName: { type: String, default: 'vietqr' },
  rawWebhookPayload: { type: Schema.Types.Mixed },
  completedAt: { type: Date },
}, {
  timestamps: true,
});

TopupOrderSchema.index({ userId: 1, createdAt: -1 });

export const TopupOrder = mongoose.model<ITopupOrder>('TopupOrder', TopupOrderSchema);
