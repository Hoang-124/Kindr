// server/src/models/Product.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;              // Xu (1 Xu = 10.000 VND)
  condition: '70' | '80' | '90';
  conditionLabel: string;
  category: string;
  ageRange?: string;
  distance?: string;
  locationName: string;
  wardId?: string;
  districtId?: string;
  image: string;
  additionalImages: string[];
  description: string;
  sellerId: Types.ObjectId;
  sellerName: string;
  sellerAvatar: string;
  sellerPhone?: string;
  sellerZalo?: string;
  safeFeeLocked: number;
  status: 'pending_approval' | 'available' | 'escrow' | 'completed' | 'disputed' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  condition: { type: String, enum: ['70', '80', '90'], required: true },
  conditionLabel: { type: String, required: true },
  category: { type: String, required: true, index: true },
  ageRange: { type: String },
  distance: { type: String },
  locationName: { type: String, required: true },
  wardId: { type: String },
  districtId: { type: String, index: true },
  image: { type: String, required: true },
  additionalImages: { type: [String], default: [] },
  description: { type: String, required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sellerName: { type: String, required: true },
  sellerAvatar: { type: String, default: '' },
  sellerPhone: { type: String },
  sellerZalo: { type: String },
  safeFeeLocked: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending_approval', 'available', 'escrow', 'completed', 'disputed', 'removed'],
    default: 'available',
    index: true,
  },
}, {
  timestamps: true,
});

// Text index for search & compound filter index
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ status: 1, category: 1, districtId: 1, createdAt: -1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
