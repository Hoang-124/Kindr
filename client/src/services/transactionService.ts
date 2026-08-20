// src/services/transactionService.ts
import { api } from './api';
import { Transaction } from '../types/common';

function normalizeTransaction(raw: any): Transaction {
  return {
    ...raw,
    id: raw.id || raw._id?.toString(),
    productId: raw.productId?._id?.toString() || raw.productId?.toString() || raw.productId,
    buyerId: raw.buyerId?._id?.toString() || raw.buyerId?.toString() || raw.buyerId,
    sellerId: raw.sellerId?._id?.toString() || raw.sellerId?.toString() || raw.sellerId,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export async function createTransaction(productId: string): Promise<{ message: string; transaction: Transaction }> {
  const { data } = await api.post('/transactions', { productId });
  return {
    message: data.message,
    transaction: normalizeTransaction(data.transaction),
  };
}

export async function getMyTransactions(): Promise<Transaction[]> {
  const { data } = await api.get('/transactions/my');
  return (data.transactions || []).map(normalizeTransaction);
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const { data } = await api.get(`/transactions/${id}`);
  return normalizeTransaction(data.transaction);
}

export async function confirmHandover(transactionId: string): Promise<{ message: string }> {
  const { data } = await api.post(`/transactions/${transactionId}/handover`);
  return data;
}

export async function completeTransaction(transactionId: string): Promise<{ message: string }> {
  const { data } = await api.post(`/transactions/${transactionId}/complete`);
  return data;
}

export async function fileDispute(
  transactionId: string,
  reason: string,
  evidenceImages?: string[]
): Promise<{ message: string }> {
  const { data } = await api.post(`/transactions/${transactionId}/dispute`, {
    reason,
    evidenceImages,
  });
  return data;
}
