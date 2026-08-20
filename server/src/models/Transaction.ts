// server/src/models/Transaction.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransactionStatus =
  | 'awaiting_handover'   // Matched, Xu locked, waiting P2P handover
  | 'in_safeful_time'     // Buyer pressed "Đã nhận hàng", 6h countdown
  | 'disputed'            // Dispute opened
  | 'completed'           // 6h expired clean or manually confirmed
  | 'refunded';           // Dispute resolved in buyer's favor

export interface ITransaction extends Document {
  productId: Types.ObjectId;
  productName: string;
  productImage: string;
  productPrice: number;
  buyerId: Types.ObjectId;
  buyerName: string;
  buyerPhone?: string;
  buyerZalo?: string;
  sellerId: Types.ObjectId;
  sellerName: string;
  sellerPhone?: string;
  sellerZalo?: string;
  buyerEscrowFrozen: number;
  sellerEscrowFrozen: number;
  status: TransactionStatus;
  handoverTime?: Date;
  safefulTimeExpiresAt?: Date;
  disputeReason?: string;
  disputeEvidenceImages: string[];
  disputeStatus?: 'open' | 'resolved_buyer' | 'resolved_seller';
  qrCodePayload?: string;
  buyerRated: boolean;
  sellerRated: boolean;
  finalizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String, required: true },
  productPrice: { type: Number, required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  buyerName: { type: String, required: true },
  buyerPhone: { type: String },
  buyerZalo: { type: String },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerName: { type: String, required: true },
  sellerPhone: { type: String },
  sellerZalo: { type: String },
  buyerEscrowFrozen: { type: Number, required: true },
  sellerEscrowFrozen: { type: Number, required: true },
  status: {
    type: String,
    enum: ['awaiting_handover', 'in_safeful_time', 'disputed', 'completed', 'refunded'],
    default: 'awaiting_handover',
    index: true,
  },
  handoverTime: { type: Date },
  safefulTimeExpiresAt: { type: Date },
  disputeReason: { type: String },
  disputeEvidenceImages: { type: [String], default: [] },
  disputeStatus: { type: String, enum: ['open', 'resolved_buyer', 'resolved_seller'] },
  qrCodePayload: { type: String },
  buyerRated: { type: Boolean, default: false },
  sellerRated: { type: Boolean, default: false },
  finalizedAt: { type: Date },
}, {
  timestamps: true,
});

TransactionSchema.index({ buyerId: 1, createdAt: -1 });
TransactionSchema.index({ sellerId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1, safefulTimeExpiresAt: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
