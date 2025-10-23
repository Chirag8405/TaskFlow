// Cache management service
class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.maxMemoryCacheSize = 100; // Maximum number of items in memory cache
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  // Memory cache methods
  set(key, value, ttl = this.defaultTTL) {
    // Evict oldest entries if cache is full
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    const expiresAt = Date.now() + ttl;
    this.memoryCache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        value,
        expiresAt,
        createdAt: Date.now()
      }));
    } catch (e) {
      // Storage quota exceeded or not available
      console.warn('Failed to store in localStorage:', e);
    }
  }

  get(key) {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      if (Date.now() < memoryItem.expiresAt) {
        this.cacheHits++;
        return memoryItem.value;
      } else {
        // Expired, remove from memory cache
        this.memoryCache.delete(key);
      }
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const item = JSON.parse(stored);
        if (Date.now() < item.expiresAt) {
          // Move back to memory cache
          this.memoryCache.set(key, item);
          this.cacheHits++;
          return item.value;
        } else {
          // Expired, remove from localStorage
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (e) {
      console.warn('Failed to read from localStorage:', e);
    }

    this.cacheMisses++;
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (e) {
      console.warn('Failed to remove from localStorage:', e);
    }
  }

  clear() {
    this.memoryCache.clear();
    
    // Clear all cache items from localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to clear localStorage cache:', e);
    }
  }

  // Cache with function memoization
  memoize(fn, keyGenerator, ttl = this.defaultTTL) {
    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      const cached = this.get(key);
      
      if (cached !== null) {
        return Promise.resolve(cached);
      }

      return Promise.resolve(fn(...args)).then(result => {
        this.set(key, result, ttl);
        return result;
      });
    };
  }

  // Cache for API responses
  cacheApiCall(apiCall, key, ttl = this.defaultTTL) {
    const cached = this.get(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    return apiCall().then(result => {
      this.set(key, result, ttl);
      return result;
    });
  }

  // Cache statistics
  getStats() {
    const hitRate = this.cacheHits + this.cacheMisses > 0 
      ? (this.cacheHits / (this.cacheHits + this.cacheMisses) * 100).toFixed(2)
      : 0;

    return {
      memorySize: this.memoryCache.size,
      maxMemorySize: this.maxMemoryCacheSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`
    };
  }

  // Cleanup expired items
  cleanup() {
    const now = Date.now();
    
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now >= item.expiresAt) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (now >= item.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid item, remove it
            localStorage.removeItem(key);
          }
        }
      });
    } catch (e) {
      console.warn('Failed to cleanup localStorage cache:', e);
    }
  }

  // Preload cache with critical data
  async preloadCriticalData(preloadFunctions) {
    const promises = Object.entries(preloadFunctions).map(async ([key, fn]) => {
      try {
        if (!this.has(key)) {
          const data = await fn();
          this.set(key, data, this.defaultTTL * 2); // Longer TTL for critical data
        }
      } catch (error) {
        console.warn(`Failed to preload ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Cache invalidation patterns
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate localStorage cache
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_') && regex.test(key.substring(6))) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to invalidate localStorage cache:', e);
    }
  }

  // Background cache refresh
  backgroundRefresh(key, refreshFunction, refreshInterval = 60000) {
    const refresh = async () => {
      try {
        const data = await refreshFunction();
        this.set(key, data);
      } catch (error) {
        console.warn(`Background refresh failed for ${key}:`, error);
      }
    };

    // Initial refresh if not cached
    if (!this.has(key)) {
      refresh();
    }

    // Set up periodic refresh
    return setInterval(refresh, refreshInterval);
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);

// Log cache stats in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    console.log('[Cache Stats]', cacheService.getStats());
  }, 30000);
}

export default cacheService;

// React hook for using cache
export const useCache = () => {
  return {
    get: cacheService.get.bind(cacheService),
    set: cacheService.set.bind(cacheService),
    has: cacheService.has.bind(cacheService),
    delete: cacheService.delete.bind(cacheService),
    memoize: cacheService.memoize.bind(cacheService),
    cacheApiCall: cacheService.cacheApiCall.bind(cacheService),
    invalidatePattern: cacheService.invalidatePattern.bind(cacheService)
  };
};