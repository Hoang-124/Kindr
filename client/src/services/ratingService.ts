// src/services/ratingService.ts
import { api } from './api';

export interface SubmitRatingPayload {
  transactionId: string;
  stars: number;
  comment?: string;
  tags?: string[];
}

export async function submitRating(payload: SubmitRatingPayload): Promise<{ message: string; rating: any }> {
  const { data } = await api.post('/ratings', payload);
  return data;
}

export async function getUserRatings(userId: string): Promise<{ ratings: any[]; totalCount: number; averageStars: number }> {
  const { data } = await api.get(`/ratings/user/${userId}`);
  return data;
}
