import type { DiscoveredProduct } from "@/types";
import api from "@/utils/api";

/**
 * Scrapes a product URL to get details before tracking.
 * @param url The product URL to scrape.
 * @returns A promise that resolves to an array of discovered products (usually one).
 */
export function testScrapeProduct(url: string): Promise<DiscoveredProduct[]> {
    return api.post("/api/products/test-scrape", { url });
}
