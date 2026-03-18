import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

// Simple in-memory cache for development
// In production, you'd use Redis or similar
class MemoryCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private maxSize = 1000; // Maximum number of cached items

  set(key: string, data: any, ttlSeconds: number = 300): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expires = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

const cache = new MemoryCache();

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if condition is met
    if (skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      // Set cache headers
      res.set({
        'X-Cache': 'HIT',
        'Cache-Control': `public, max-age=${ttl}`,
      });
      
      return res.json(cachedData);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl);
      }

      // Set cache headers
      res.set({
        'X-Cache': 'MISS',
        'Cache-Control': `public, max-age=${ttl}`,
      });

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

function defaultKeyGenerator(req: Request): string {
  const url = req.originalUrl || req.url;
  const userId = (req as any).user?.userId || 'anonymous';
  
  // Create a hash of the URL and user ID for the cache key
  return createHash('md5')
    .update(`${req.method}:${url}:${userId}`)
    .digest('hex');
}

// Cache invalidation helpers
export const invalidateCache = {
  // Invalidate all cache entries
  all: () => cache.clear(),
  
  // Invalidate cache entries by pattern
  pattern: (pattern: string) => {
    // Simple pattern matching - in production use more sophisticated matching
    for (const [key] of cache['cache'].entries()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  },
  
  // Invalidate specific cache entry
  key: (key: string) => cache.delete(key),
  
  // Get cache statistics
  stats: () => cache.getStats(),
};

// Specific cache configurations for different endpoints
export const shortCache = cacheMiddleware({ ttl: 60 }); // 1 minute
export const mediumCache = cacheMiddleware({ ttl: 300 }); // 5 minutes
export const longCache = cacheMiddleware({ ttl: 3600 }); // 1 hour

// Cache for static data that rarely changes
export const staticCache = cacheMiddleware({ 
  ttl: 86400, // 24 hours
  skipCache: (req) => {
    // Skip cache for admin users or in development
    const isAdmin = (req as any).user?.isAdmin;
    const isDev = process.env.NODE_ENV === 'development';
    return isAdmin || isDev;
  },
});