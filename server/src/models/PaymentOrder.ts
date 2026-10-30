// server/src/models/PaymentOrder.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentOrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
export type PaymentOrderType = 'TOPUP' | 'WITHDRAW' | 'ESCROW_LOCK' | 'ESCROW_RELEASE' | 'REFUND';

export interface IPaymentOrder extends Document {
  orderCode: number;
  userId: Types.ObjectId;
  userName?: string;
  userPhone?: string;
  type: PaymentOrderType;
  xuAmount: number;
  vndAmount: number;
  status: PaymentOrderStatus;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  accountNumber?: string;
  accountName?: string;
  bin?: string;
  description?: string;
  webhookData?: any;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentOrderSchema = new Schema<IPaymentOrder>({
  orderCode: { type: Number, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String },
  userPhone: { type: String },
  type: {
    type: String,
    enum: ['TOPUP', 'WITHDRAW', 'ESCROW_LOCK', 'ESCROW_RELEASE', 'REFUND'],
    default: 'TOPUP',
    index: true,
  },
  xuAmount: { type: Number, required: true, min: 1 },
  vndAmount: { type: Number, required: true, min: 1000 },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'],
    default: 'PENDING',
    index: true,
  },
  paymentLinkId: { type: String },
  checkoutUrl: { type: String },
  qrCode: { type: String },
  accountNumber: { type: String },
  accountName: { type: String },
  bin: { type: String },
  description: { type: String },
  webhookData: { type: Schema.Types.Mixed },
  paidAt: { type: Date },
}, {
  timestamps: true,
});

PaymentOrderSchema.index({ userId: 1, createdAt: -1 });
PaymentOrderSchema.index({ status: 1, createdAt: -1 });

export const PaymentOrder = mongoose.model<IPaymentOrder>('PaymentOrder', PaymentOrderSchema);
export const WalletTransaction = PaymentOrder;
export type IWalletTransaction = IPaymentOrder;

