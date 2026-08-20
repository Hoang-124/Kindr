// src/types/common.ts

export type CategoryType = 
  | 'toy_small' 
  | 'toy_large' 
  | 'book' 
  | 'charity' 
  | 'quan_ao' 
  | 'sach_truyen' 
  | 'do_choi' 
  | 'xe_noi' 
  | 'do_hoc_tap' 
  | 'tu_thien' 
  | string;

export type ConditionType = 
  | '70' 
  | '80' 
  | '90' 
  | 'new' 
  | 'like_new' 
  | 'good' 
  | 'fair';

export interface Product {
  id: string;
  name: string;
  price: number; // Đơn vị: Xu (1 Xu = 10.000 VNĐ)
  condition: ConditionType;
  conditionLabel: string; // VD: "Mới 90%"
  category: CategoryType;
  ageRange?: string; // 0-6m, 6-12m, 1-3y, 3+
  distance?: string; // e.g., "0.8 km"
  locationName: string; // VD: "Phường Thạch Thang, Q. Hải Châu, Đà Nẵng"
  wardId?: string;
  districtId?: string;
  timeAgo: string;
  createdAt: string;
  image: string;
  additionalImages?: string[];
  description: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerPhone?: string;
  sellerZalo?: string;
  safeFeeLocked?: number;
  status: 'available' | 'escrow' | 'completed' | 'disputed' | 'removed';
}

export type TransactionStatus = 
  | 'frozen'              // Legacy frozen state
  | 'shipped'             // Legacy shipped state
  | 'awaiting_handover'   // Matched, Xu locked, waiting P2P handover
  | 'in_safeful_time'     // Buyer pressed "Đã nhận hàng", 6h countdown running
  | 'disputed'            // Dispute opened
  | 'completed'           // 6h expired clean or manually confirmed -> Xu released
  | 'refunded';           // Dispute resolved in buyer's favor -> Xu refunded

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;       // Item price in Xu
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  buyerZalo?: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerZalo?: string;
  buyerEscrowFrozen: number;  // Buyer's price locked in escrow
  sellerEscrowFrozen: number; // Seller's 10% Safe Fee locked in escrow
  status: TransactionStatus;
  handoverTime?: string;
  safefulTimeExpiresAt?: string; // ISO String timestamp for 6h expiration
  disputeReason?: string;
  evidenceImages?: string[];
  disputeEvidenceImages?: string[];
  disputeStatus?: 'open' | 'resolved_buyer' | 'resolved_seller';
  createdAt: string;
  finalizedAt?: string;
  qrCodePayload?: string;
  buyerRated?: boolean;
  sellerRated?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  messages: Message[];
  unreadCount: number;
  lastMessageText: string;
  lastMessageTime: string;
}

// ----------------------------------------------------
// Care Handbook (Sổ Tay Mẹ Bỉm & Tiện Ích Chăm Con)
// ----------------------------------------------------

export interface VaccineDose {
  id: string;
  name: string;
  ageRecommendation: string;
  ageInMonths: number;
  diseaseTarget: string;
  isCompleted: boolean;
  completedDate?: string;
  facilityName?: string;
  notes?: string;
}

export interface GrowthRecord {
  id: string;
  childName: string;
  date: string;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  whoWeightStatus: 'severely_underweight' | 'underweight' | 'normal' | 'overweight';
  whoHeightStatus: 'stunted' | 'normal' | 'tall';
}

export interface CommunityReview {
  id: string;
  title: string;
  category: 'daycare' | 'clinic' | 'playground';
  categoryLabel: string;
  rating: number; // 1 to 5
  address: string;
  wardName: string;
  districtName: string;
  reviewerName: string;
  reviewerAvatar: string;
  childAge?: string;
  comment: string;
  likesCount: number;
  createdAt: string;
}
