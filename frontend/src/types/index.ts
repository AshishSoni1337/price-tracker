export type Product = {
    _id: string;
    name: string;
    url: string;
    description: string;
    images: string[];
    currentPrice: number;
    platform: string;
    status: "ACTIVE" | "PAUSED" | "ERROR";
    createdAt: string;
};

export type Variation = {
    _id: string;
    size?: string;
    color?: string;
    price: number;
    attributes?: Record<string, string>;
};

export type ProductDetails = {
    _id: string;
    name: string;
    description: string;
    url: string;
    images: string[];
    currentPrice: number;
    status: "ACTIVE" | "PAUSED" | "ERROR";
    variations: Variation[];
};

export type DiscoveredProduct = {
    name: string;
    price: number | null;
    description: string;
    images: string[];
    uniqueId: string | null;
};

export interface PriceHistoryPoint {
    _time: string;
    _value: number;
}

// --- Error Log Types ---

export interface ErrorLog {
    _id: string;
    errorMessage: string;
    url: string;
    timestamp: string;
}

export interface PaginatedErrorResponse {
    errors: ErrorLog[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
}

export interface ErrorLogDetails extends ErrorLog {
    stackTrace: string;
    screenshot?: string;
}

export interface GetErrorsParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "asc" | "desc";
}
