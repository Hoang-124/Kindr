// src/services/productService.ts
import { api } from './api';
import { Product } from '../types/common';

export interface ProductFilters {
  category?: string;
  districtId?: string;
  condition?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  condition: '70' | '80' | '90';
  conditionLabel: string;
  category: string;
  ageRange?: string;
  locationName: string;
  wardId?: string;
  districtId?: string;
  image: string;
  additionalImages?: string[];
  description: string;
}

function normalizeProduct(raw: any): Product {
  return {
    ...raw,
    id: raw.id || raw._id?.toString(),
    timeAgo: raw.timeAgo || 'Vừa xong',
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export async function getProducts(filters?: ProductFilters): Promise<{ products: Product[]; pagination: any }> {
  const { data } = await api.get('/products', { params: filters });
  return {
    products: (data.products || []).map(normalizeProduct),
    pagination: data.pagination,
  };
}

export async function getMyProducts(): Promise<Product[]> {
  const { data } = await api.get('/products/my');
  return (data.products || []).map(normalizeProduct);
}

export async function getProductById(id: string): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return normalizeProduct(data.product);
}

export async function createProduct(payload: CreateProductPayload): Promise<{ message: string; product: Product }> {
  const { data } = await api.post('/products', payload);
  return {
    message: data.message,
    product: normalizeProduct(data.product),
  };
}

export async function updateProduct(id: string, payload: Partial<CreateProductPayload>): Promise<Product> {
  const { data } = await api.put(`/products/${id}`, payload);
  return normalizeProduct(data.product);
}

export async function deleteProduct(id: string): Promise<{ message: string }> {
  const { data } = await api.delete(`/products/${id}`);
  return data;
}
