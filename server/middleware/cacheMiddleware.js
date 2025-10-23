const redis = require('redis');
const NodeCache = require('node-cache');

// In-memory cache fallback if Redis is not available
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects for better performance
});

class CacheMiddleware {
  constructor() {
    this.redisClient = null;
    this.isRedisConnected = false;
    this.initRedis();
  }

  async initRedis() {
    try {
      if (process.env.REDIS_URL) {
        this.redisClient = redis.createClient({
          url: process.env.REDIS_URL,
          retry_strategy: (options) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              console.log('Redis server connection refused.');
              return 5000; // Retry after 5 seconds
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              console.log('Redis retry time exhausted.');
              return null;
            }
            if (options.attempt > 10) {
              console.log('Redis max retry attempts reached.');
              return null;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        this.redisClient.on('connect', () => {
          console.log('Redis client connected');
          this.isRedisConnected = true;
        });

        this.redisClient.on('error', (err) => {
          console.log('Redis client error:', err);
          this.isRedisConnected = false;
        });

        await this.redisClient.connect();
      }
    } catch (error) {
      console.log('Redis not available, using in-memory cache:', error.message);
      this.isRedisConnected = false;
    }
  }

  // Get value from cache
  async get(key) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return memoryCache.get(key) || null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set value in cache
  async set(key, value, ttl = 300) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      } else {
        memoryCache.set(key, value, ttl);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete from cache
  async del(key) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        memoryCache.del(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Clear cache by pattern
  async clearPattern(pattern) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        const keys = memoryCache.keys();
        const regex = new RegExp(pattern.replace('*', '.*'));
        keys.forEach(key => {
          if (regex.test(key)) {
            memoryCache.del(key);
          }
        });
      }
    } catch (error) {
      console.error('Cache clear pattern error:', error);
    }
  }

  // Generate cache key
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }

  // Cache middleware factory
  cache(options = {}) {
    const {
      ttl = 300,
      keyGenerator = null,
      condition = null,
      prefix = 'api'
    } = options;

    return async (req, res, next) => {
      // Skip caching for non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip if condition returns false
      if (condition && !condition(req)) {
        return next();
      }

      // Generate cache key
      const key = keyGenerator 
        ? keyGenerator(req)
        : this.generateKey(prefix, req.originalUrl, JSON.stringify(req.query));

      try {
        // Try to get from cache
        const cachedData = await this.get(key);
        if (cachedData) {
          res.set('X-Cache', 'HIT');
          return res.json(cachedData);
        }

        // Store original res.json
        const originalJson = res.json;

        // Override res.json to cache the response
        res.json = (data) => {
          res.set('X-Cache', 'MISS');
          
          // Cache successful responses only
          if (res.statusCode === 200) {
            this.set(key, data, ttl).catch(err => {
              console.error('Cache set error:', err);
            });
          }

          // Call original json method
          return originalJson.call(res, data);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  // Conditional cache based on user
  userCache(options = {}) {
    return this.cache({
      ...options,
      keyGenerator: (req) => this.generateKey(
        options.prefix || 'user',
        req.user?._id || 'anonymous',
        req.originalUrl,
        JSON.stringify(req.query)
      )
    });
  }

  // Cache for specific routes
  routeCache(route, options = {}) {
    return this.cache({
      ...options,
      condition: (req) => req.route?.path === route,
      keyGenerator: (req) => this.generateKey(
        options.prefix || 'route',
        route,
        JSON.stringify(req.params),
        JSON.stringify(req.query)
      )
    });
  }

  // Cache invalidation middleware
  invalidateCache(patterns) {
    return async (req, res, next) => {
      const originalJson = res.json;

      res.json = (data) => {
        // Invalidate cache on successful write operations
        if ((req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') 
            && res.statusCode < 400) {
          
          if (Array.isArray(patterns)) {
            patterns.forEach(pattern => {
              this.clearPattern(pattern).catch(err => {
                console.error('Cache invalidation error:', err);
              });
            });
          } else {
            this.clearPattern(patterns).catch(err => {
              console.error('Cache invalidation error:', err);
            });
          }
        }

        return originalJson.call(res, data);
      };

      next();
    };
  }

  // Cache statistics
  async getStats() {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const info = await this.redisClient.info('memory');
        return {
          type: 'redis',
          connected: this.isRedisConnected,
          memory: info
        };
      } else {
        return {
          type: 'memory',
          keys: memoryCache.keys().length,
          stats: memoryCache.getStats()
        };
      }
    } catch (error) {
      return {
        type: 'error',
        error: error.message
      };
    }
  }

  // Warmup cache with critical data
  async warmup(warmupFunctions) {
    console.log('Starting cache warmup...');
    
    const promises = Object.entries(warmupFunctions).map(async ([key, fn]) => {
      try {
        const data = await fn();
        await this.set(key, data, 3600); // 1 hour TTL for warmup data
        console.log(`Cache warmed up: ${key}`);
      } catch (error) {
        console.error(`Cache warmup failed for ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('Cache warmup completed');
  }

  // Close connections
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    memoryCache.close();
  }
}

// Create singleton instance
const cacheMiddleware = new CacheMiddleware();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await cacheMiddleware.close();
});

process.on('SIGINT', async () => {
  await cacheMiddleware.close();
});

module.exports = cacheMiddleware;