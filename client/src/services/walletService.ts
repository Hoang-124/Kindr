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

export interface TopupOrderData {
  orderCode: string;
  xuAmount: number;
  vndAmount: number;
  memo: string;
  vietqrUrl: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  createdAt: string;
}

export interface CreateOrderResponse {
  message: string;
  order: TopupOrderData;
}

export interface OrderStatusResponse {
  orderCode: string;
  status: 'pending' | 'completed' | 'cancelled' | 'expired';
  xuAmount: number;
  vndAmount: number;
  completedAt?: string;
}

export interface PayOSPaymentLinkResult {
  success: boolean;
  message?: string;
  orderCode: number;
  xuAmount: number;
  vndAmount: number;
  checkoutUrl: string;
  qrCode: string;
  accountNumber?: string;
  accountName?: string;
  bin?: string;
  description?: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
}

export interface PayOSStatusResponse {
  orderCode: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  xuAmount: number;
  vndAmount: number;
  paidAt?: string;
  checkoutUrl?: string;
  qrCode?: string;
}

export interface PayOSOrderItem {
  _id: string;
  orderCode: number;
  xuAmount: number;
  vndAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  checkoutUrl?: string;
  qrCode?: string;
  accountNumber?: string;
  accountName?: string;
  bin?: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
}

export async function getWalletBalance(): Promise<WalletBalance> {
  const { data } = await api.get<WalletBalance>('/wallet/balance');
  return data;
}

export async function topUpXu(xuAmount: number): Promise<TopupResponse> {
  const { data } = await api.post<TopupResponse>('/wallet/topup', { xuAmount });
  return data;
}

export async function createTopupOrder(xuAmount: number): Promise<CreateOrderResponse> {
  const { data } = await api.post<CreateOrderResponse>('/wallet/create-order', { xuAmount });
  return data;
}

export async function checkOrderStatus(orderCode: string): Promise<OrderStatusResponse> {
  const { data } = await api.get<OrderStatusResponse>(`/wallet/orders/${orderCode}/status`);
  return data;
}

export async function createPayOSPaymentLink(xuAmount: number): Promise<PayOSPaymentLinkResult> {
  const { data } = await api.post<PayOSPaymentLinkResult>('/wallet/topup/create-link', { xuAmount });
  return data;
}

export async function getPayOSOrderStatus(orderCode: number): Promise<PayOSStatusResponse> {
  const { data } = await api.get<PayOSStatusResponse>(`/wallet/topup/status/${orderCode}`);
  return data;
}

export async function cancelPayOSOrder(orderCode: number): Promise<{ success: boolean; message: string; orderCode: number; status: string }> {
  const { data } = await api.post(`/wallet/topup/cancel/${orderCode}`);
  return data;
}

export async function simulatePayOSSuccess(orderCode: number): Promise<{ success: boolean; message: string; order: any; newBalance: number }> {
  const { data } = await api.post(`/wallet/topup/simulate-success/${orderCode}`);
  return data;
}

export async function requestWithdraw(payload: WithdrawPayload): Promise<{ message: string; withdrawRequest: any }> {
  const { data } = await api.post('/wallet/withdraw', payload);
  return data;
}

export async function getWalletHistory(): Promise<{ withdrawRequests: any[]; topupOrders?: any[]; payosOrders?: PayOSOrderItem[] }> {
  const { data } = await api.get('/wallet/history');
  return data;
}
