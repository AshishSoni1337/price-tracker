import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

const getApiBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_API_BASE_URL is not set. This is required for the application to connect to the backend.');
    // Return an empty string and let the browser use the current domain. This may fail.
    return '';
  }
  return baseUrl;
};

export const API_BASE_URL = getApiBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling common success scenarios
api.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    // Log the error for debugging
    console.error('API Error:', error.response?.data || error.message);

    // Here, we can handle specific error statuses or codes globally
    // For now, we'll just re-throw the error to be caught by the calling service.
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
