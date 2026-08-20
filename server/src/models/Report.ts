// server/src/models/Report.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReport extends Document {
  targetType: 'user' | 'product' | 'transaction';
  targetId: Types.ObjectId;
  reporterId: Types.ObjectId;
  reporterName: string;
  reason: string;
  status: 'open' | 'reviewed' | 'dismissed';
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  targetType: { type: String, enum: ['user', 'product', 'transaction'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reporterName: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open', 'reviewed', 'dismissed'], default: 'open', index: true },
  adminNote: { type: String },
}, {
  timestamps: true,
});

export const Report = mongoose.model<IReport>('Report', ReportSchema);
