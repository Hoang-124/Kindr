// d:\Kindr\web\src\types\index.ts

export type CategoryType =
  | 'toy_small'
  | 'toy_large'
  | 'book'
  | 'quan_ao'
  | 'xe_noi'
  | 'do_hoc_tap'
  | 'charity'
  | 'do_choi'
  | 'sach_truyen'
  | 'tu_thien';

export type ConditionType = '90' | '80' | '70';

export interface CivilizationHistoryLog {
  pointsChanged: number;
  reason: string;
  date: string;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  location?: {
    districtId?: string;
    districtName?: string;
    addressDetail?: string;
  };
  xuBalance: number;
  xuFrozen: number;
  welcomeCreditRemaining: number;
  civilizationPoints: number;
  historyPoints?: CivilizationHistoryLog[];
  tradesCount: number;
  reputationScore: number;
  ratingCount: number;
  isLocked: boolean;
  isActivated?: boolean;
  disputeStrikeCount: number;
  role: 'user' | 'admin';
  createdAt?: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  price: number;
  condition: ConditionType;
  conditionLabel: string;
  category: CategoryType | string;
  ageRange?: string;
  distance?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationName: string;
  wardId?: string;
  districtId?: string;
  image: string;
  additionalImages?: string[];
  description: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  sellerPhone?: string;
  sellerZalo?: string;
  safeFeeLocked: number;
  safeFeePromoXu?: number;
  status: 'pending_approval' | 'available' | 'escrow' | 'completed' | 'disputed' | 'removed' | 'cancelled';
  createdAt: string;
}

export type TransactionStatus =
  | 'awaiting_handover'
  | 'in_safeful_time'
  | 'disputed'
  | 'completed'
  | 'refunded'
  | 'frozen'
  | 'shipped';

export interface Transaction {
  id: string;
  _id?: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  buyerZalo?: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerZalo?: string;
  buyerEscrowFrozen: number;
  sellerEscrowFrozen: number;
  buyerPromoXu?: number;
  status: TransactionStatus;
  handoverTime?: string;
  safefulTimeExpiresAt?: string;
  disputeReason?: string;
  disputeEvidenceImages?: string[];
  disputeStatus?: 'open' | 'resolved_buyer' | 'resolved_seller';
  qrCodePayload?: string;
  handoverCode?: string;
  handoverFailedAttempts?: number;
  buyerRated?: boolean;
  sellerRated?: boolean;
  finalizedAt?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  _id?: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  createdAt?: string;
  isRead?: boolean;
}

export interface ChatSession {
  id: string;
  _id?: string;
  productId: string;
  productName: string;
  productImage: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  messages?: Message[];
}

export interface NotificationItem {
  id: string;
  _id?: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  relatedTransactionId?: string;
  relatedProductId?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface RatingItem {
  id: string;
  _id?: string;
  transactionId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName?: string;
  stars: number;
  comment: string;
  tags?: string[];
  createdAt: string;
}

export interface TopupOrderData {
  orderCode: string;
  xuAmount: number;
  vndAmount: number;
  memo: string;
  vietqrUrl: string;
  bankName: string;
  accountNumber: string;
  accountHolder?: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  createdAt?: string;
}

export interface WithdrawRequestItem {
  id: string;
  _id?: string;
  userId: string;
  userName: string;
  xuAmount: number;
  vndAmount: number;
  feeVnd: number;
  payoutVnd: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  _id?: string;
  targetType: 'user' | 'product' | 'transaction';
  targetId: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: 'open' | 'reviewed' | 'dismissed';
  adminNote?: string;
  createdAt: string;
}

export interface CategoryItem {
  id: string;
  _id?: string;
  name: string;
  code: string;
  icon?: string;
  itemsCount?: number;
}

export interface WaitlistEntry {
  id: string;
  _id?: string;
  email: string;
  phone?: string;
  userRole: string;
  interest: string;
  orderNumber: number;
  foundingMember: boolean;
  xuClaimed: boolean;
  createdAt: string;
}
