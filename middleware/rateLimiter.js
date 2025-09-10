import { LRUCache } from 'lru-cache';

// Create cache instances for different rate limits
const tokenCache = new LRUCache({
  max: 500, // Maximum number of tokens to store
  ttl: 1000 * 60 * 15, // 15 minutes
});

const requestCache = new LRUCache({
  max: 1000, // Maximum number of IPs to track
  ttl: 1000 * 60 * 15, // 15 minutes
});

// Rate limiter configurations
const rateLimitConfigs = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  },
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.',
  },
  // File upload endpoints - more restrictive
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
    message: 'Batas upload tercapai. Coba lagi dalam 1 jam.',
  },
  // Public endpoints - moderate limits
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200, // 200 requests per window
    message: 'Terlalu banyak permintaan. Coba lagi dalam 15 menit.',
  }
};

// Get client IP address
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    '127.0.0.1'
  );
}

// Create rate limiter middleware
export function createRateLimiter(type = 'api') {
  const config = rateLimitConfigs[type] || rateLimitConfigs.api;
  
  return async (req, res, next) => {
    try {
      const ip = getClientIP(req);
      const key = `${type}:${ip}`;
      const now = Date.now();
      
      // Get current request count for this IP
      const requestData = requestCache.get(key) || { count: 0, resetTime: now + config.windowMs };
      
      // Reset counter if window has expired
      if (now > requestData.resetTime) {
        requestData.count = 0;
        requestData.resetTime = now + config.windowMs;
      }
      
      // Check if limit exceeded
      if (requestData.count >= config.maxRequests) {
        const timeUntilReset = Math.ceil((requestData.resetTime - now) / 1000);
        
        return res.status(429).json({
          success: false,
          message: config.message,
          retryAfter: timeUntilReset,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: new Date(requestData.resetTime).toISOString()
        });
      }
      
      // Increment counter
      requestData.count += 1;
      requestCache.set(key, requestData);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - requestData.count));
      res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Don't block requests if rate limiter fails
      next();
    }
  };
}

// Specific rate limiters for different endpoint types
export const authRateLimit = createRateLimiter('auth');
export const apiRateLimit = createRateLimiter('api');
export const uploadRateLimit = createRateLimiter('upload');
export const publicRateLimit = createRateLimiter('public');

// Advanced rate limiter with sliding window
export function createSlidingWindowRateLimiter(maxRequests, windowMs, message) {
  return async (req, res, next) => {
    try {
      const ip = getClientIP(req);
      const key = `sliding:${ip}`;
      const now = Date.now();
      
      // Get request timestamps for this IP
      const requests = requestCache.get(key) || [];
      
      // Remove old requests outside the window
      const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
      
      // Check if limit exceeded
      if (validRequests.length >= maxRequests) {
        const oldestRequest = Math.min(...validRequests);
        const timeUntilReset = Math.ceil((oldestRequest + windowMs - now) / 1000);
        
        return res.status(429).json({
          success: false,
          message: message || 'Terlalu banyak permintaan. Coba lagi nanti.',
          retryAfter: timeUntilReset,
          limit: maxRequests,
          remaining: 0
        });
      }
      
      // Add current request timestamp
      validRequests.push(now);
      requestCache.set(key, validRequests);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - validRequests.length));
      
      next();
    } catch (error) {
      console.error('Sliding window rate limiter error:', error);
      next();
    }
  };
}

// IP whitelist functionality
const whitelist = new Set([
  '127.0.0.1',
  '::1',
  // Add more IPs as needed
]);

export function addToWhitelist(ip) {
  whitelist.add(ip);
}

export function removeFromWhitelist(ip) {
  whitelist.delete(ip);
}

export function isWhitelisted(ip) {
  return whitelist.has(ip);
}

// Bypass rate limiting for whitelisted IPs
export function createWhitelistAwareRateLimiter(type = 'api') {
  const rateLimiter = createRateLimiter(type);
  
  return (req, res, next) => {
    const ip = getClientIP(req);
    
    if (isWhitelisted(ip)) {
      return next();
    }
    
    return rateLimiter(req, res, next);
  };
}

export default {
  createRateLimiter,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  publicRateLimit,
  createSlidingWindowRateLimiter,
  createWhitelistAwareRateLimiter,
  addToWhitelist,
  removeFromWhitelist,
  isWhitelisted
};