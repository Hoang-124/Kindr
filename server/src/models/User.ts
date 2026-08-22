// server/src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICivilizationLog {
  pointsChanged: number;
  reason: string;
  date: Date;
}

export interface IUser extends Document {
  name: string;
  phone?: string;
  email?: string;
  googleId?: string;
  passwordHash?: string;
  avatar: string;
  location: {
    districtId: string;
    districtName: string;
    addressDetail: string;
  };
  xuBalance: number;
  xuFrozen: number;
  welcomeCreditRemaining: number;
  civilizationPoints: number;
  tradesCount: number;
  reputationScore: number;
  ratingCount: number;
  isLocked: boolean;
  disputeStrikeCount: number;
  historyPoints: ICivilizationLog[];
  role: 'user' | 'admin';
  refreshTokens: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CivilizationLogSchema = new Schema<ICivilizationLog>({
  pointsChanged: { type: Number, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now },
}, { _id: true });

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  phone: { type: String, sparse: true, index: true, default: '' },
  email: { type: String, sparse: true, trim: true, lowercase: true, index: true },
  googleId: { type: String, sparse: true, index: true },
  passwordHash: { type: String, default: '' },
  avatar: { type: String, default: '' },
  location: {
    districtId: { type: String, default: '' },
    districtName: { type: String, default: '' },
    addressDetail: { type: String, default: '' },
  },
  xuBalance: { type: Number, default: 10, min: 0 },        // Welcome credit = 10 Xu
  xuFrozen: { type: Number, default: 0, min: 0 },
  welcomeCreditRemaining: { type: Number, default: 10 },
  civilizationPoints: { type: Number, default: 95, min: 0, max: 100 },
  tradesCount: { type: Number, default: 0 },
  reputationScore: { type: Number, default: 5.0 },
  ratingCount: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  disputeStrikeCount: { type: Number, default: 0 },
  historyPoints: { type: [CivilizationLogSchema], default: [] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  refreshTokens: { type: [String], default: [] },
}, {
  timestamps: true,
});

// Never return passwordHash or refreshTokens in JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokens;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);
