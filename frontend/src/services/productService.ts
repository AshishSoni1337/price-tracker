import api from "@/utils/api";
import type { Product, ProductDetails, PriceHistoryPoint } from "@/types";

export interface GetProductsParams {
    page?: number;
    limit?: number;
    search?: string;
    platform?: string;
}

export interface PaginatedProducts {
    products: Product[];
    totalPages: number;
    currentPage: number;
    totalProducts: number;
}


export function getProducts(params: GetProductsParams = {}): Promise<PaginatedProducts> {
    return api.get("/api/products", { params });
}

export function getProductById(id: string): Promise<ProductDetails> {
    return api.get(`/api/products/${id}`);
}

export function getProductHistory(id: string, range: string = '-30d'): Promise<PriceHistoryPoint[]> {
    return api.get(`/api/products/${id}/history`, { params: { range } })
}

export function toggleProductAlert(id: string, isEnabled: boolean): Promise<ProductDetails> {
    return api.patch(`/api/products/${id}/alert`, { isEnabled })
}

export function addProduct(url: string): Promise<Product> {
    return api.post("/api/products", { url });
}

export function updateProductStatus(id: string, status: "ACTIVE" | "PAUSED"): Promise<Product> {
    return api.patch(`/api/products/${id}/status`, { status });
}
