'use client';

import { useState, useEffect } from 'react';
import { getErrorLogs, getErrorLogDetails } from '@/services/errorLogService';
import type { ErrorLog, ErrorLogDetails, GetErrorsParams } from '@/services/errorLogService';
import { API_BASE_URL } from '@/utils/api';
import { ExternalLink, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';

const ErrorDetailsModal = ({ errorDetails, onClose }: { errorDetails: ErrorLogDetails | null, onClose: () => void }) => {
    if (!errorDetails) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Error Details</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-600 text-sm mb-1">Message</h3>
                        <p className="text-red-700 bg-red-50 p-3 rounded-lg font-mono text-sm">{errorDetails.errorMessage}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-600 text-sm mb-1">URL</h3>
                        <a href={errorDetails.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all flex items-center text-sm">
                            {errorDetails.url} <ExternalLink size={14} className="ml-2"/>
                        </a>
                    </div>
                    {errorDetails.screenshot && (
                         <div>
                            <h3 className="font-semibold text-gray-600 text-sm mb-1">Screenshot</h3>
                            <a href={`${API_BASE_URL}/api/errors/${errorDetails._id}/screenshot`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center text-sm">
                                View Screenshot <ExternalLink size={14} className="ml-2"/>
                            </a>
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-gray-600 text-sm mb-1">Stack Trace</h3>
                        <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg text-xs overflow-x-auto"><code>{errorDetails.stackTrace}</code></pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center space-x-2 mt-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
            </span>
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2 rounded-md bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

export default function ErrorsPage() {
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedError, setSelectedError] = useState<ErrorLogDetails | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        const fetchErrors = async () => {
            setIsLoading(true);
            try {
                const params: GetErrorsParams = { page: currentPage, limit };
                const data = await getErrorLogs(params);
                setErrorLogs(data.errors);
                setTotalPages(data.totalPages);
            } catch {
                setError('Failed to fetch error logs.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchErrors();
    }, [currentPage, limit]);

    const handleViewDetails = async (id: string) => {
        try {
            const details = await getErrorLogDetails(id);
            setSelectedError(details);
        } catch {
            alert('Failed to fetch error details.');
        }
    };
    
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 md:p-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Application Error Logs</h1>
                    <div className="flex items-center">
                        <label htmlFor="limit-select" className="mr-2 text-sm font-medium text-gray-600">Show:</label>
                        <select
                            id="limit-select"
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-8 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
                        </select>
                    </div>
                </div>

                {isLoading && (
                     <div className="space-y-4">
                        {Array.from({ length: limit }).map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 pr-4">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {error && <p className="text-center text-red-600 bg-red-100 p-4 rounded-md">Error: {error}</p>}

                {!isLoading && !error && (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 table-fixed">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Message</th>
                                        <th scope="col" className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affected URL</th>
                                        <th scope="col" className="w-1/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                        <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {errorLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 max-w-sm break-words">
                                                <p className="text-sm font-medium text-red-600" title={log.errorMessage}>{log.errorMessage}</p>
                                            </td>
                                            <td className="px-6 py-4 max-w-sm break-words">
                                                <a href={log.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-indigo-600" title={log.url}>
                                                    {log.url}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleViewDetails(log._id)} className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                    <Eye size={16} className="mr-2 text-gray-400" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                <ErrorDetailsModal errorDetails={selectedError} onClose={() => setSelectedError(null)} />
            </div>
        </div>
    );
} 