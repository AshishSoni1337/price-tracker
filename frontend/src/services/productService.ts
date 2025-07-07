import api from "@/utils/api";
import type { Product, ProductDetails, PriceHistoryPoint } from "@/types";

export function getProducts(): Promise<Product[]> {
    return api.get("/api/products");
}

export function getProductById(id: string): Promise<ProductDetails> {
    return api.get(`/api/products/${id}`);
}

export function getProductHistory(id: string, range?: string): Promise<PriceHistoryPoint[]> {
    return api.get(`/api/products/${id}/history`, { params: { range } });
}

export function addProduct(url: string): Promise<Product> {
    return api.post("/api/products", { url });
}

export function updateProductStatus(id: string, status: "ACTIVE" | "PAUSED"): Promise<Product> {
    return api.patch(`/api/products/${id}/status`, { status });
}
