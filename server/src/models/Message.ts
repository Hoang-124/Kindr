// server/src/models/Message.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
}, {
  timestamps: true,
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
