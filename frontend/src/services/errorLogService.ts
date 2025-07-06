import api from "@/utils/api";
import type {
    PaginatedErrorResponse,
    GetErrorsParams,
    ErrorLogDetails,
} from "@/types";

export function getErrorLogs(
    params: GetErrorsParams = {}
): Promise<PaginatedErrorResponse> {
    return api.get("/api/errors", { params });
}

export function getErrorLogDetails(id: string): Promise<ErrorLogDetails> {
    return api.get(`/api/errors/${id}`);
}
