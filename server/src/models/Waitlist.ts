// server/src/models/Waitlist.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWaitlist extends Document {
  email: string;
  phone?: string;
  userRole?: string;
  interest?: string;
  surveyAnswers?: Record<string, any>;
  ip?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  orderNumber: number;
  foundingMember: boolean;
  consentAt: Date;
  consentVersion: string;
  xuClaimed: boolean;
  xuClaimedAt?: Date;
  claimedByUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    userRole: {
      type: String,
      trim: true,
      default: 'mom',
    },
    interest: {
      type: String,
      trim: true,
      default: 'Đồ chơi vận động',
    },
    surveyAnswers: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: '',
    },
    utmSource: {
      type: String,
      default: 'direct',
    },
    utmMedium: {
      type: String,
      default: 'web',
    },
    utmCampaign: {
      type: String,
      default: 'mvp_launch',
    },
    orderNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    foundingMember: {
      type: Boolean,
      default: false,
      index: true,
    },
    consentAt: {
      type: Date,
      default: Date.now,
    },
    consentVersion: {
      type: String,
      default: '2026-10',
    },
    xuClaimed: {
      type: Boolean,
      default: false,
      index: true,
    },
    xuClaimedAt: {
      type: Date,
    },
    claimedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Waitlist = mongoose.models.Waitlist || mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);
