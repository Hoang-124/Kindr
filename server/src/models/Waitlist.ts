// server/src/models/Waitlist.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IWaitlist extends Document {
  email: string;
  phone?: string;
  userRole?: string;
  interest?: string;
  ip?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  orderNumber: number;
  createdAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>({
  email: { 
    type: String, 
    required: true, 
    trim: true, 
    lowercase: true, 
    index: true 
  },
  phone: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  userRole: {
    type: String,
    trim: true,
    default: 'mother'
  },
  interest: {
    type: String,
    trim: true,
    default: 'Đồ chơi vận động'
  },
  ip: { 
    type: String, 
    default: '' 
  },
  utmSource: { 
    type: String, 
    default: 'direct' 
  },
  utmMedium: { 
    type: String, 
    default: 'web' 
  },
  utmCampaign: { 
    type: String, 
    default: 'mvp_launch' 
  },
  orderNumber: { 
    type: Number, 
    required: true 
  },
}, {
  timestamps: true,
});

export const Waitlist = mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);
