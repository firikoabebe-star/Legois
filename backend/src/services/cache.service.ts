import { logger } from '@/utils/logger';

// Define Redis types to avoid import issues when Redis is not available
interface RedisClientType {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  get(key: string): Promise<string | null>;
  setEx(key: string, seconds: number, value: string): Promise<void>;
  del(key: string | string[]): Promise<number>;
  exists(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushAll(): Promise<void>;
  mGet(keys: string[]): Promise<(string | null)[]>;
  multi(): any;
  info(section?: string): Promise<string>;
  dbSize(): Promise<number>;
  on(event: string, listener: (...args: any[]) => void): void;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
}

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private useRedis = process.env.REDIS_URL !== undefined;

  constructor() {
    // Disable Redis for now, use memory cache only
    this.useRedis = false;
    logger.info('Using in-memory cache (Redis disabled)');
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Dynamically import Redis to avoid issues when not available
      const { createClient } = await import('redis');
      
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      }) as RedisClientType;

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis', error as Error);
      this.client = null;
      this.isConnected = false;
      this.useRedis = false; // Fallback to memory cache
    }
  }

  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.useRedis && this.isConnected && this.client) {
        const value = await this.client.get(fullKey);
        if (value === null) return null;
        
        return options.serialize !== false ? JSON.parse(value) : value;
      } else {
        // Fallback to memory cache
        const cached = this.memoryCache.get(fullKey);
        if (!cached) return null;
        
        if (Date.now() > cached.expires) {
          this.memoryCache.delete(fullKey);
          return null;
        }
        
        return cached.value;
      }
    } catch (error) {
      logger.error('Cache get error', error as Error, { key: fullKey });
      return null;
    }
  }

  async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);
    const ttl = options.ttl || 3600; // Default 1 hour

    try {
      if (this.useRedis && this.isConnected && this.client) {
        const serializedValue = options.serialize !== false ? JSON.stringify(value) : value as string;
        await this.client.setEx(fullKey, ttl, serializedValue);
        return true;
      } else {
        // Fallback to memory cache
        this.memoryCache.set(fullKey, {
          value,
          expires: Date.now() + (ttl * 1000),
        });
        return true;
      }
    } catch (error) {
      logger.error('Cache set error', error as Error, { key: fullKey });
      return false;
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.useRedis && this.isConnected && this.client) {
        await this.client.del(fullKey);
        return true;
      } else {
        this.memoryCache.delete(fullKey);
        return true;
      }
    } catch (error) {
      logger.error('Cache delete error', error as Error, { key: fullKey });
      return false;
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const fullKey = this.buildKey(key, options.prefix);

    try {
      if (this.useRedis && this.isConnected && this.client) {
        const exists = await this.client.exists(fullKey);
        return exists === 1;
      } else {
        const cached = this.memoryCache.get(fullKey);
        if (!cached) return false;
        
        if (Date.now() > cached.expires) {
          this.memoryCache.delete(fullKey);
          return false;
        }
        
        return true;
      }
    } catch (error) {
      logger.error('Cache exists error', error as Error, { key: fullKey });
      return false;
    }
  }

  async flush(prefix?: string): Promise<boolean> {
    try {
      if (this.useRedis && this.isConnected && this.client) {
        if (prefix) {
          const pattern = this.buildKey('*', prefix);
          const keys = await this.client.keys(pattern);
          if (keys.length > 0) {
            await this.client.del(keys);
          }
        } else {
          await this.client.flushAll();
        }
        return true;
      } else {
        if (prefix) {
          const prefixKey = `${prefix}:`;
          for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefixKey)) {
              this.memoryCache.delete(key);
            }
          }
        } else {
          this.memoryCache.clear();
        }
        return true;
      }
    } catch (error) {
      logger.error('Cache flush error', error as Error, { prefix });
      return false;
    }
  }

  async mget<T = any>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    const fullKeys = keys.map(key => this.buildKey(key, options.prefix));

    try {
      if (this.useRedis && this.isConnected && this.client) {
        const values = await this.client.mGet(fullKeys);
        return values.map(value => {
          if (value === null) return null;
          return options.serialize !== false ? JSON.parse(value) : value;
        });
      } else {
        return fullKeys.map(key => {
          const cached = this.memoryCache.get(key);
          if (!cached) return null;
          
          if (Date.now() > cached.expires) {
            this.memoryCache.delete(key);
            return null;
          }
          
          return cached.value;
        });
      }
    } catch (error) {
      logger.error('Cache mget error', error as Error, { keys: fullKeys });
      return keys.map(() => null);
    }
  }

  async mset<T = any>(
    keyValuePairs: Array<{ key: string; value: T }>, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    const ttl = options.ttl || 3600;

    try {
      if (this.useRedis && this.isConnected && this.client) {
        const pipeline = this.client.multi();
        
        keyValuePairs.forEach(({ key, value }) => {
          const fullKey = this.buildKey(key, options.prefix);
          const serializedValue = options.serialize !== false ? JSON.stringify(value) : value as string;
          pipeline.setEx(fullKey, ttl, serializedValue);
        });
        
        await pipeline.exec();
        return true;
      } else {
        const expires = Date.now() + (ttl * 1000);
        keyValuePairs.forEach(({ key, value }) => {
          const fullKey = this.buildKey(key, options.prefix);
          this.memoryCache.set(fullKey, { value, expires });
        });
        return true;
      }
    } catch (error) {
      logger.error('Cache mset error', error as Error);
      return false;
    }
  }

  // Cache with function execution
  async remember<T = any>(
    key: string,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  // Cache statistics
  async getStats(): Promise<{
    type: 'redis' | 'memory';
    connected: boolean;
    keyCount: number;
    memoryUsage?: string;
  }> {
    try {
      if (this.useRedis && this.isConnected && this.client) {
        const info = await this.client.info('memory');
        const keyCount = await this.client.dbSize();
        
        return {
          type: 'redis',
          connected: true,
          keyCount,
          memoryUsage: this.parseRedisMemoryInfo(info),
        };
      } else {
        return {
          type: 'memory',
          connected: true,
          keyCount: this.memoryCache.size,
          memoryUsage: `${this.memoryCache.size} keys`,
        };
      }
    } catch (error) {
      logger.error('Cache stats error', error as Error);
      return {
        type: this.useRedis ? 'redis' : 'memory',
        connected: false,
        keyCount: 0,
      };
    }
  }

  private buildKey(key: string, prefix?: string): string {
    const basePrefix = process.env.CACHE_PREFIX || 'notion_clone';
    const fullPrefix = prefix ? `${basePrefix}:${prefix}` : basePrefix;
    return `${fullPrefix}:${key}`;
  }

  private parseRedisMemoryInfo(info: string): string {
    const lines = info.split('\r\n');
    const usedMemoryLine = lines.find(line => line.startsWith('used_memory_human:'));
    return usedMemoryLine ? usedMemoryLine.split(':')[1] : 'unknown';
  }

  // Cleanup expired keys in memory cache
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now > cached.expires) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Start cleanup interval for memory cache
  startCleanupInterval(): void {
    if (!this.useRedis) {
      setInterval(() => {
        this.cleanupMemoryCache();
      }, 60000); // Cleanup every minute
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
    }
  }
}

// Singleton instance
export const cacheService = new CacheService();