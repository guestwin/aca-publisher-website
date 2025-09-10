import { LRUCache } from 'lru-cache';

// Memory cache configuration
const memoryCache = new LRUCache({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 15, // 15 minutes TTL
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

// Redis client (optional - fallback to memory if Redis not available)
let redisClient = null;

// Initialize Redis connection if available
const initRedis = async () => {
  if (process.env.REDIS_URL) {
    try {
      const { createClient } = await import('redis');
      redisClient = createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server connection refused.');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });
      
      await redisClient.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.log('Redis not available, using memory cache only:', error.message);
      redisClient = null;
    }
  }
};

// Initialize Redis on module load
initRedis();

// Cache key generators
export const generateCacheKey = (prefix, ...args) => {
  return `${prefix}:${args.join(':')}`;
};

// Generic cache operations
export const cache = {
  // Get from cache
  async get(key) {
    try {
      // Try Redis first if available
      if (redisClient && redisClient.isOpen) {
        const value = await redisClient.get(key);
        if (value) {
          return JSON.parse(value);
        }
      }
      
      // Fallback to memory cache
      return memoryCache.get(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return memoryCache.get(key);
    }
  },
  
  // Set to cache
  async set(key, value, ttl = 900) { // Default 15 minutes
    try {
      // Set in memory cache
      memoryCache.set(key, value, { ttl: ttl * 1000 });
      
      // Set in Redis if available
      if (redisClient && redisClient.isOpen) {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Cache set error:', error);
      // Ensure memory cache is set even if Redis fails
      memoryCache.set(key, value, { ttl: ttl * 1000 });
    }
  },
  
  // Delete from cache
  async del(key) {
    try {
      // Delete from memory cache
      memoryCache.delete(key);
      
      // Delete from Redis if available
      if (redisClient && redisClient.isOpen) {
        await redisClient.del(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },
  
  // Clear cache by pattern
  async clear(pattern = '*') {
    try {
      // Clear memory cache
      if (pattern === '*') {
        memoryCache.clear();
      } else {
        // Clear specific pattern from memory cache
        for (const key of memoryCache.keys()) {
          if (key.includes(pattern)) {
            memoryCache.delete(key);
          }
        }
      }
      
      // Clear Redis if available
      if (redisClient && redisClient.isOpen) {
        if (pattern === '*') {
          await redisClient.flushDb();
        } else {
          const keys = await redisClient.keys(`*${pattern}*`);
          if (keys.length > 0) {
            await redisClient.del(keys);
          }
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },
  
  // Get cache stats
  getStats() {
    return {
      memory: {
        size: memoryCache.size,
        max: memoryCache.max,
        calculatedSize: memoryCache.calculatedSize
      },
      redis: {
        connected: redisClient ? redisClient.isOpen : false
      }
    };
  }
};

// Specific cache functions for different data types
export const productCache = {
  // Cache product list
  async getProducts(filters = {}) {
    const key = generateCacheKey('products', JSON.stringify(filters));
    return await cache.get(key);
  },
  
  async setProducts(filters = {}, products, ttl = 300) { // 5 minutes for product lists
    const key = generateCacheKey('products', JSON.stringify(filters));
    await cache.set(key, products, ttl);
  },
  
  // Cache single product
  async getProduct(id) {
    const key = generateCacheKey('product', id);
    return await cache.get(key);
  },
  
  async setProduct(id, product, ttl = 900) { // 15 minutes for single product
    const key = generateCacheKey('product', id);
    await cache.set(key, product, ttl);
  },
  
  // Clear product cache
  async clearProducts() {
    await cache.clear('products');
    await cache.clear('product');
  }
};

export const userCache = {
  // Cache user data (excluding sensitive info)
  async getUser(id) {
    const key = generateCacheKey('user', id);
    return await cache.get(key);
  },
  
  async setUser(id, user, ttl = 1800) { // 30 minutes for user data
    const key = generateCacheKey('user', id);
    // Remove sensitive data before caching
    const { password, verificationToken, resetPasswordToken, ...safeUser } = user;
    await cache.set(key, safeUser, ttl);
  },
  
  async clearUser(id) {
    const key = generateCacheKey('user', id);
    await cache.del(key);
  }
};

export const composerCache = {
  // Cache composer data
  async getComposer(id) {
    const key = generateCacheKey('composer', id);
    return await cache.get(key);
  },
  
  async setComposer(id, composer, ttl = 3600) { // 1 hour for composer data
    const key = generateCacheKey('composer', id);
    await cache.set(key, composer, ttl);
  },
  
  async getComposers(filters = {}) {
    const key = generateCacheKey('composers', JSON.stringify(filters));
    return await cache.get(key);
  },
  
  async setComposers(filters = {}, composers, ttl = 1800) { // 30 minutes for composer lists
    const key = generateCacheKey('composers', JSON.stringify(filters));
    await cache.set(key, composers, ttl);
  },
  
  async clearComposers() {
    await cache.clear('composer');
  }
};

// Cache middleware for API routes
export const withCache = (handler, options = {}) => {
  const { 
    keyGenerator = (req) => `api:${req.url}:${JSON.stringify(req.query)}`,
    ttl = 300,
    methods = ['GET']
  } = options;
  
  return async (req, res) => {
    // Only cache specified methods
    if (!methods.includes(req.method)) {
      return handler(req, res);
    }
    
    const cacheKey = keyGenerator(req);
    
    try {
      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }
      
      // Intercept response to cache it
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          cache.set(cacheKey, data, ttl).catch(console.error);
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };
      
      return handler(req, res);
    } catch (error) {
      console.error('Cache middleware error:', error);
      return handler(req, res);
    }
  };
};

// Cleanup function
export const cleanup = async () => {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
    memoryCache.clear();
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
};

// Export default cache instance
export default cache;