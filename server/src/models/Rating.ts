// server/src/models/Rating.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRating extends Document {
  transactionId: Types.ObjectId;
  fromUserId: Types.ObjectId;
  fromUserName: string;
  toUserId: Types.ObjectId;
  toUserName: string;
  stars: number;            // 1-5
  comment: string;
  tags: string[];           // Quick tags like "Đồ mới đúng mô tả", "Giao nhanh"
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fromUserName: { type: String, required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  toUserName: { type: String, required: true },
  stars: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  tags: { type: [String], default: [] },
}, {
  timestamps: true,
});

// One rating per user per transaction
RatingSchema.index({ transactionId: 1, fromUserId: 1 }, { unique: true });

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
