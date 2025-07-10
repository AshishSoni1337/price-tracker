import api from "@/utils/api";
import type {
    PaginatedErrorResponse,
    GetErrorsParams,
    ErrorLogDetails,
} from "@/types";

export function getErrorLogs(
    params: GetErrorsParams = {}
): Promise<PaginatedErrorResponse> {
    const apiParams = { ...params };
    if (apiParams.errorType === 'all') {
        delete apiParams.errorType;
    }
    return api.get("/api/errors", { params: apiParams });
}

export function getErrorLogDetails(id: string): Promise<ErrorLogDetails> {
    return api.get(`/api/errors/${id}`);
}
