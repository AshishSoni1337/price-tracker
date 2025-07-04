import api from '@/utils/api';

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
    screenshot?: string; // The backend sends a buffer, but we'll handle the URL to it
}

export interface GetErrorsParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
}

export async function getErrorLogs(params: GetErrorsParams = {}): Promise<PaginatedErrorResponse> {
    return await api.get('/api/errors', { params });
}

export async function getErrorLogDetails(id: string): Promise<ErrorLogDetails> {
    return await api.get(`/api/errors/${id}`);
} 