import axios from 'axios';
import cacheService from './cacheService';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Performance monitoring
const performanceMetrics = {
  requests: 0,
  totalTime: 0,
  errors: 0,
  cacheHits: 0
};

// Request interceptor to add auth token and performance monitoring
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request start time for performance monitoring
    config.metadata = { startTime: performance.now() };
    performanceMetrics.requests++;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with caching and performance monitoring
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = performance.now() - response.config.metadata.startTime;
    performanceMetrics.totalTime += duration;

    // Log slow requests in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`Slow API request: ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration.toFixed(2)}ms`);
    }

    return response;
  },
  (error) => {
    performanceMetrics.errors++;

    // Calculate request duration even for errors
    if (error.config?.metadata?.startTime) {
      const duration = performance.now() - error.config.metadata.startTime;
      performanceMetrics.totalTime += duration;
    }

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 429) {
      // Rate limiting - show user-friendly message
      error.message = 'Too many requests. Please wait a moment and try again.';
    }

    if (error.code === 'ECONNABORTED') {
      // Timeout error
      error.message = 'Request timeout. Please check your connection and try again.';
    }

    return Promise.reject(error);
  }
);

// Enhanced API methods with caching
const enhancedApi = {
  // Regular methods without caching
  post: api.post,
  put: api.put,
  patch: api.patch,
  delete: api.delete,

  // GET method with optional caching
  get: async (url, config = {}) => {
    const { useCache = false, cacheKey, cacheTTL = 5 * 60 * 1000, ...axiosConfig } = config;

    if (useCache) {
      const key = cacheKey || `api_${url}_${JSON.stringify(axiosConfig.params || {})}`;
      
      // Check cache first
      const cached = cacheService.get(key);
      if (cached) {
        performanceMetrics.cacheHits++;
        return { data: cached };
      }

      // Make API call and cache result
      const response = await api.get(url, axiosConfig);
      cacheService.set(key, response.data, cacheTTL);
      return response;
    }

    return api.get(url, axiosConfig);
  },

  // Batch requests
  batch: async (requests) => {
    const startTime = performance.now();
    
    try {
      const responses = await Promise.allSettled(requests);
      const duration = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Batch request (${requests.length} requests) completed in ${duration.toFixed(2)}ms`);
      }

      return responses;
    } catch (error) {
      console.error('Batch request failed:', error);
      throw error;
    }
  },

  // Paginated requests with automatic fetching
  getPaginated: async (url, options = {}) => {
    const { 
      page = 1, 
      limit = 20, 
      useCache = true,
      autoFetchAll = false,
      maxPages = 10 
    } = options;

    let allData = [];
    let currentPage = page;
    let hasMore = true;
    let totalPages = 1;

    while (hasMore && currentPage <= maxPages) {
      const response = await enhancedApi.get(url, {
        params: { page: currentPage, limit },
        useCache,
        cacheKey: useCache ? `paginated_${url}_${currentPage}_${limit}` : undefined
      });

      const { data, pagination } = response.data;
      allData = [...allData, ...data];

      if (pagination) {
        hasMore = pagination.hasMore;
        totalPages = pagination.totalPages;
      } else {
        hasMore = false;
      }

      if (!autoFetchAll) {
        return {
          data: allData,
          pagination: {
            currentPage,
            totalPages,
            hasMore,
            total: pagination?.total
          }
        };
      }

      currentPage++;
    }

    return {
      data: allData,
      pagination: {
        currentPage: totalPages,
        totalPages,
        hasMore: false,
        total: allData.length
      }
    };
  },

  // Retry mechanism for failed requests
  retry: async (requestFn, maxRetries = 3, delay = 1000) => {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }

        if (i < maxRetries - 1) {
          // Exponential backoff
          const waitTime = delay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError;
  },

  // Optimistic updates
  optimisticUpdate: async (updateFn, rollbackFn, apiCall) => {
    // Apply optimistic update
    updateFn();

    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      // Rollback on error
      rollbackFn();
      throw error;
    }
  },

  // Cancel requests
  cancelToken: () => axios.CancelToken.source(),

  // Upload with progress
  uploadWithProgress: (url, data, onProgress) => {
    return api.post(url, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      },
    });
  },

  // Download with progress
  downloadWithProgress: (url, onProgress) => {
    return api.get(url, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      },
    });
  },

  // Performance metrics
  getMetrics: () => ({
    ...performanceMetrics,
    averageTime: performanceMetrics.requests > 0 
      ? performanceMetrics.totalTime / performanceMetrics.requests 
      : 0,
    successRate: performanceMetrics.requests > 0
      ? ((performanceMetrics.requests - performanceMetrics.errors) / performanceMetrics.requests * 100).toFixed(2)
      : 100,
    cacheHitRate: performanceMetrics.requests > 0
      ? (performanceMetrics.cacheHits / performanceMetrics.requests * 100).toFixed(2)
      : 0
  }),

  // Clear cache for specific patterns
  clearCache: (pattern) => {
    if (pattern) {
      cacheService.invalidatePattern(pattern);
    } else {
      cacheService.clear();
    }
  },

  // Preload critical data
  preload: async (endpoints) => {
    const preloadFunctions = {};
    endpoints.forEach(({ key, url, params }) => {
      preloadFunctions[key] = () => enhancedApi.get(url, { params });
    });

    await cacheService.preloadCriticalData(preloadFunctions);
  }
};

// Debug API performance in development
if (process.env.NODE_ENV === 'development') {
  window.apiMetrics = enhancedApi.getMetrics;
  window.clearApiCache = enhancedApi.clearCache;
  
  setInterval(() => {
    const metrics = enhancedApi.getMetrics();
    if (metrics.requests > 0) {
      console.log('[API Metrics]', metrics);
    }
  }, 60000); // Log every minute
}

export { enhancedApi as api };
export default enhancedApi;