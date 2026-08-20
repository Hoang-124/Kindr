// server/src/models/Chat.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IChat extends Document {
  productId: Types.ObjectId;
  productName: string;
  productImage: string;
  buyerId: Types.ObjectId;
  buyerName: string;
  sellerId: Types.ObjectId;
  sellerName: string;
  lastMessageText: string;
  lastMessageTime: Date;
  buyerUnreadCount: number;
  sellerUnreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String, default: '' },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  buyerName: { type: String, required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerName: { type: String, required: true },
  lastMessageText: { type: String, default: '' },
  lastMessageTime: { type: Date, default: Date.now },
  buyerUnreadCount: { type: Number, default: 0 },
  sellerUnreadCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Compound index to find chats for a user
ChatSchema.index({ buyerId: 1, sellerId: 1, productId: 1 }, { unique: true });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);
