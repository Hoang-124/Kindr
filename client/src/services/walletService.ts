// src/services/walletService.ts
import { api } from './api';

export interface WalletBalance {
  xuBalance: number;
  xuFrozen: number;
  welcomeCreditRemaining: number;
  totalXu: number;
}

export interface TopupResponse {
  message: string;
  newBalance: number;
  vietqrUrl: string;
  vndAmount: number;
}

export interface WithdrawPayload {
  xuAmount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const { data } = await api.get<WalletBalance>('/wallet/balance');
  return data;
}

export async function topUpXu(xuAmount: number): Promise<TopupResponse> {
  const { data } = await api.post<TopupResponse>('/wallet/topup', { xuAmount });
  return data;
}

export async function requestWithdraw(payload: WithdrawPayload): Promise<{ message: string; withdrawRequest: any }> {
  const { data } = await api.post('/wallet/withdraw', payload);
  return data;
}

export async function getWalletHistory(): Promise<{ withdrawRequests: any[] }> {
  const { data } = await api.get('/wallet/history');
  return data;
}
