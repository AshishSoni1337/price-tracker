import api from "@/utils/api";
import type { DiscoveredProduct } from "@/types";

export type DiscoverAPIResponse = DiscoveredProduct & {
    isTracked: boolean;
};

export function discoverProducts(
    platform: string,
    query: string
): Promise<DiscoverAPIResponse[]> {
    return api.post("/api/products/discover", {
        platform,
        query,
    });
}
