// src/types/user.ts

export interface CivilizationHistoryLog {
  id: string;
  pointsChanged: number; // +5, -10, etc.
  reason: string;
  date: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  location: {
    districtId: string;
    districtName: string;
    addressDetail: string;
  };
  xuBalance: number;              // Total available Xu balance
  xuFrozen: number;               // Xu locked in Double Escrow
  welcomeCreditRemaining: number; // Non-withdrawable welcome gift Xu (10 Xu)
  civilizationPoints: number;     // Điểm "Mẹ Bỉm Văn Minh" (0 - 100)
  historyPoints: CivilizationHistoryLog[];
  tradesCount: number;
  reputationScore: number;        // Average rating (1.0 to 5.0)
  ratingAverage?: number;         // Backward compatibility alias for admin screens
  ratingCount: number;            // Total ratings received
  isLocked: boolean;              // Auto-locked if strike threshold reached
  disputeStrikeCount: number;     // Number of dispute/report strikes
  role?: 'user' | 'admin';
  createdAt?: string;
}
