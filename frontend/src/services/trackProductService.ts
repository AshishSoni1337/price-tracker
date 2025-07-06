import type { DiscoveredProduct } from '@/types';
import api from '@/utils/api';

/**
 * Scrapes a product URL to get details before tracking.
 * @param url The product URL to scrape.
 * @returns A promise that resolves to an array of discovered products (usually one).
 */
export async function testScrapeProduct(url: string): Promise<DiscoveredProduct[]> {
  // The backend uses the /api/discover route for this, which is fine.
  // We are just renaming the frontend service for clarity.
  return await api.post('/api/products/test-scrape', { url });
} 