import axios, {
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosResponse,
  HttpStatusCode,
  isAxiosError,
} from 'axios';
import { errorToast } from '../components/Toast';
import { BASE_URL, localStorageNames } from '../conf/conf';
// Removed generateUUID import - using simpler approach
import { logoutAndRedirect } from './SessionApis';

const DEFAULT_ERROR_MESSAGE = "We're unable to process your request at this time. Please try again later.";
const DEFAULT_TIMEOUT_ERROR_MESSAGE = 'Request timed out. Please try again later.';
const DEFAULT_RESPONSE_TYPE = 'json';
const TIMEOUT_SECONDS = Number(process.env.NEXT_PUBLIC_WEB_TIMEOUT_SECONDS) || 60;
const CREDENTIALS = true;

/**
 * Interface defining the parameters for API calls
 * Provides a type-safe way to configure HTTP requests
 */
interface ApiCallParams {
  url: string;
  method: 'get' | 'GET' | 'delete' | 'DELETE' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH';
  abortSignal?: AbortSignal;
  data?: unknown;
  customHeaders?: Record<string, string>;
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
  disableErrorToast?: boolean;
  responseType?: 'blob' | 'json' | 'text' | 'arraybuffer' | 'stream' | 'formdata' | 'document';
  params?: Record<string, string | boolean | number | undefined | null | string[] | number[]>;
  callType?: 'api' | 'session';
}

/**
 * Creates and configures an Axios instance with interceptors
 * Sets up common request/response handling and error management
 * @returns Configured Axios instance
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_SECONDS * 1000,
    withCredentials: CREDENTIALS,
    responseType: DEFAULT_RESPONSE_TYPE,
    timeoutErrorMessage: DEFAULT_TIMEOUT_ERROR_MESSAGE,
  });

  // Request interceptor for common headers
  instance.interceptors.request.use((config: any) => {
    // Add caller-request-id if not present for request tracking
    if (!config.headers['caller-request-id']) {
      config.headers['caller-request-id'] = `web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    return config;
  });

  // Response interceptor for common error handling
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: any) => {
      // Handle common errors at interceptor level
      if (isAxiosError(error) && error.response?.status === HttpStatusCode.Unauthorized) {
        logoutAndRedirect();
      }
      // Ensure we always reject with an Error object
      if (error instanceof Error) {
        return Promise.reject(error);
      } else {
        return Promise.reject(new Error(typeof error === 'string' ? error : 'Unknown error occurred'));
      }
    }
  );

  return instance;
};

// Memoized axios instance - created once and reused
const axiosInstance = createAxiosInstance();

// Cache for request deduplication - prevents duplicate requests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Generates a unique cache key for request deduplication
 * Combines method, URL, data, and headers to identify duplicate requests
 * @param params - API call parameters
 * @returns Unique string key for caching
 */
const generateCacheKey = (params: ApiCallParams): string => {
  const { url, method, data, customHeaders } = params;
  return `${method}:${url}:${JSON.stringify(data)}:${JSON.stringify(customHeaders)}`;
};

/**
 * Centralized error handler for API calls
 * Provides consistent error handling and user feedback
 * @param error - The error to handle
 * @param disableErrorToast - whether to show error toast
 * @throws The original error after handling
 */
async function handleApiError(error: any, disableErrorToast: boolean): Promise<never> {
  if (!isAxiosError(error)) {
    throw error;
  }

  let errMsg = error.response?.data?.error?.message;

  // Handle blob responses with JSON content
  const blob = error.response?.data;
  const contentType = error.response?.headers['content-type'];

  if (blob instanceof Blob && contentType?.includes('application/json')) {
    try {
      const json = await blob.text().then(JSON.parse);
      errMsg = json?.error?.message;
    } catch {
      errMsg = DEFAULT_ERROR_MESSAGE;
    }
  }

  // Fallback to default error message if no specific message found
  if (!errMsg) {
    errMsg = DEFAULT_ERROR_MESSAGE;
  }
  const status = error.response?.status;

  // Handle specific status codes with appropriate user feedback
  if (!disableErrorToast && status !== HttpStatusCode.Unauthorized && error.code !== 'ERR_CANCELED') {
    errorToast(errMsg);
  }

  throw error;
}

/**
 * Creates default headers for API requests
 * Memoized to avoid recreating headers on every request
 * @param customHeaders - Additional headers to merge
 * @returns Combined headers object
 */
const getDefaultHeaders = (customHeaders: Record<string, string> = {}): Record<string, string> => {
  const isContentType = !!customHeaders['Content-Type'];
  return {
    ...(isContentType ? {} : { 'Content-Type': 'application/json' }),
    ...customHeaders,
  };
};

/**
 * Main API call function with request deduplication and error handling
 * Provides a unified interface for making HTTP requests
 * @param params - API call configuration parameters
 * @returns Promise resolving to the API response
 */
export async function apiCall({
  url,
  method,
  abortSignal,
  data = {},
  customHeaders = {},
  onUploadProgress,
  onDownloadProgress,
  disableErrorToast = false,
  responseType,
  params,
  callType = 'api',
}: ApiCallParams) {
  // Check for pending duplicate requests to prevent redundant calls
  const cacheKey = generateCacheKey({ url, method, data, customHeaders });
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  if (callType === 'api') {
    localStorage.setItem(localStorageNames.lastActivityTimeLocalStorageName, new Date().toISOString());
  }

  const headers = getDefaultHeaders(customHeaders);

  // Configure the Axios request
  const config: AxiosRequestConfig = {
    url,
    method,
    signal: abortSignal,
    headers,
    onUploadProgress,
    onDownloadProgress,
    data,
    responseType,
    params,
  };

  // Create the request promise with error handling and cleanup
  const requestPromise = axiosInstance(config)
    .catch((error: unknown) => handleApiError(error, disableErrorToast))
    .finally(() => {
      // Clean up pending request from cache
      pendingRequests.delete(cacheKey);
    });

  // Store the pending request for deduplication
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
}

// Export axios instance for direct use if needed
export { axiosInstance };

/**
 * Utility function to clear all pending requests
 * Useful for testing or when you need to reset the request cache
 */
export const clearPendingRequests = (): void => {
  pendingRequests.clear();
};
