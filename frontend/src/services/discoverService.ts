import type { DiscoveredProduct } from '@/types';
import api from '@/utils/api';

export async function discoverProducts(url: string): Promise<DiscoveredProduct[]> {
  return await api.post('/api/discover', { url });
} 