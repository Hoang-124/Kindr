// server/src/models/CareRecord.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export type CareRecordType = 'vaccine' | 'growth' | 'community_review';

export interface ICareRecord extends Document {
  userId: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  childName?: string;
  type: CareRecordType;
  
  // Vaccine specific fields
  vaccineId?: string;
  vaccineName?: string;
  ageRecommendation?: string;
  diseaseTarget?: string;
  isCompleted?: boolean;
  completedDate?: string;
  facilityName?: string;
  notes?: string;

  // Growth tracking specific fields (WHO standards)
  date?: string;
  ageMonths?: number;
  weightKg?: number;
  heightCm?: number;
  whoWeightStatus?: 'underweight' | 'normal' | 'overweight';
  whoHeightStatus?: 'stunted' | 'normal' | 'tall';

  // Review specific fields
  reviewTitle?: string;
  reviewCategory?: string;
  reviewRating?: number;
  reviewAddress?: string;
  reviewComment?: string;
  reviewLikesCount?: number;

  createdAt: Date;
  updatedAt: Date;
}

const CareRecordSchema = new Schema<ICareRecord>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true },
  userAvatar: { type: String },
  childName: { type: String, default: 'Bé cưng' },
  type: {
    type: String,
    enum: ['vaccine', 'growth', 'community_review'],
    required: true,
    index: true,
  },
  
  // Vaccine
  vaccineId: { type: String },
  vaccineName: { type: String },
  ageRecommendation: { type: String },
  diseaseTarget: { type: String },
  isCompleted: { type: Boolean, default: false },
  completedDate: { type: String },
  facilityName: { type: String },
  notes: { type: String },

  // Growth
  date: { type: String },
  ageMonths: { type: Number },
  weightKg: { type: Number },
  heightCm: { type: Number },
  whoWeightStatus: { type: String, enum: ['underweight', 'normal', 'overweight'], default: 'normal' },
  whoHeightStatus: { type: String, enum: ['stunted', 'normal', 'tall'], default: 'normal' },

  // Review
  reviewTitle: { type: String },
  reviewCategory: { type: String },
  reviewRating: { type: Number, default: 5 },
  reviewAddress: { type: String },
  reviewComment: { type: String },
  reviewLikesCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

CareRecordSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const CareRecord = mongoose.model<ICareRecord>('CareRecord', CareRecordSchema);
