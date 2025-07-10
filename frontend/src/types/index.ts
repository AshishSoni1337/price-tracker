export interface Variation {
    _id: string;
    product: string;
    size?: string;
    color?: string;
    price: number;
    attributes?: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    _id: string;
    name: string;
    url: string;
    platform: string;
    currentPrice: number;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    lastScrapedAt: string;
    images: string[];
    availability: string;
}

export interface ProductDetails extends Product {
    description: string;
    images: string[];
    variations: { price: number }[];
    alertEnabled: boolean;
}

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
