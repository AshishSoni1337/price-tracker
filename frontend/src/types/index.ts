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
    url: string;
    image: string | null;
};

export interface PriceHistoryPoint {
    _time: string;
    _value: number;
}

// --- Error Log Types ---

export interface ErrorLog {
    _id: string;
    errorMessage: string;
    stack?: string;
    url: string;
    errorType: 'unknown' | 'Error page';
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
    errorType?: string;
}
