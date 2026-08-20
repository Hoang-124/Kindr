// server/src/models/Notification.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'welcome_credit'
  | 'match_request'
  | 'safeful_time_started'
  | 'xu_released'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'rating_received'
  | 'withdraw_approved'
  | 'withdraw_rejected'
  | 'system';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedTransactionId?: Types.ObjectId;
  relatedProductId?: Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
  relatedProductId: { type: Schema.Types.ObjectId, ref: 'Product' },
}, {
  timestamps: true,
});

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
