import type { Product, ProductDetails, PriceHistoryPoint } from '@/types';
import api from '@/utils/api';

export async function getProducts(): Promise<Product[]> {
  return await api.get('/api/products');
}

export async function getProductById(id: string): Promise<ProductDetails> {
  return await api.get(`/api/products/${id}`);
}

export async function getProductHistory(id: string): Promise<PriceHistoryPoint[]> {
  try {
    return await api.get(`/api/products/${id}/history`);
  } catch (error) {
    // Not a critical error, so we can return an empty array
    console.warn('Could not fetch price history:', error);
    return [];
  }
}

export async function addProduct(url: string): Promise<Product> {
  return await api.post('/api/products', { url });
}

export async function updateProductStatus(id: string, status: 'ACTIVE' | 'PAUSED'): Promise<Product> {
  return await api.patch(`/api/products/${id}/status`, { status });
} 