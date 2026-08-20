// src/types/rating.ts

export interface Rating {
  id: string;
  transactionId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  stars: number; // 1 to 5
  comment: string;
  createdAt: string;
}
