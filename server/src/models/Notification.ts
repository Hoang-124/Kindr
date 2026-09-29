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
  | 'post_pending_admin'
  | 'post_submitted'
  | 'post_approved'
  | 'post_rejected'
  | 'topup_success'
  | 'system';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  relatedTransactionId?: Types.ObjectId;
  relatedProductId?: Types.ObjectId;
  data?: Record<string, any>;
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
  data: { type: Schema.Types.Mixed },
}, {
  timestamps: true,
});

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
