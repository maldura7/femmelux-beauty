import { createClient, RedisClientType } from 'redis';
import { config } from './index';

let redisClient: RedisClientType | null = null;
let isConnecting = false;

/**
 * Redis connection options
 */
interface RedisOptions {
  url?: string;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Default Redis configuration
 */
const defaultOptions: RedisOptions = {
  url: config.redisUrl || 'redis://localhost:6379',
  retryAttempts: 5,
  retryDelay: 1000,
};

/**
 * Connect to Redis with retry logic
 *
 * @param options - Redis connection options
 * @returns Redis client instance
 */
export async function connectRedis(options: RedisOptions = {}): Promise<RedisClientType> {
  // Return existing client if already connected
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (redisClient?.isOpen) {
      return redisClient;
    }
  }

  isConnecting = true;
  const opts = { ...defaultOptions, ...options };

  try {
    redisClient = createClient({
      url: opts.url,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries >= (opts.retryAttempts || 5)) {
            console.error(`Redis: Max retry attempts (${opts.retryAttempts}) reached`);
            return new Error('Max retry attempts reached');
          }
          const delay = Math.min(retries * (opts.retryDelay || 1000), 5000);
          console.log(`Redis: Reconnecting in ${delay}ms (attempt ${retries + 1})`);
          return delay;
        },
      },
    });

    // Event handlers
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis: Connected successfully');
    });

    redisClient.on('ready', () => {
      console.log('Redis: Client ready');
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis: Reconnecting...');
    });

    redisClient.on('end', () => {
      console.log('Redis: Connection closed');
    });

    await redisClient.connect();
    isConnecting = false;
    return redisClient;
  } catch (error) {
    isConnecting = false;
    console.error('Redis: Connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from Redis gracefully
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    const client = redisClient;
    try {
      await client.quit();
      redisClient = null;
      console.log('Redis: Disconnected gracefully');
    } catch (error) {
      console.error('Redis: Error during disconnect:', error);
      // Force close if quit fails
      await client.disconnect();
      redisClient = null;
    }
  }
}

/**
 * Get the current Redis client instance
 *
 * @returns Redis client or null if not connected
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

/**
 * Check if Redis is connected
 *
 * @returns True if connected
 */
export function isRedisConnected(): boolean {
  return redisClient?.isOpen ?? false;
}

/**
 * Redis health check
 *
 * @returns Health status object
 */
export async function redisHealthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> {
  if (!redisClient?.isOpen) {
    return { status: 'unhealthy', error: 'Not connected' };
  }

  try {
    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;

    return { status: 'healthy', latency };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// CACHE UTILITIES
// ============================================

/**
 * Set a value in Redis cache with optional expiration
 *
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttlSeconds - Time to live in seconds (optional)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  if (!redisClient?.isOpen) {
    throw new Error('Redis client not connected');
  }

  const serialized = JSON.stringify(value);

  if (ttlSeconds) {
    await redisClient.setEx(key, ttlSeconds, serialized);
  } else {
    await redisClient.set(key, serialized);
  }
}

/**
 * Get a value from Redis cache
 *
 * @param key - Cache key
 * @returns Parsed value or null if not found
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisClient?.isOpen) {
    throw new Error('Redis client not connected');
  }

  const value = await redisClient.get(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Delete a key from Redis cache
 *
 * @param key - Cache key to delete
 */
export async function cacheDelete(key: string): Promise<void> {
  if (!redisClient?.isOpen) {
    throw new Error('Redis client not connected');
  }

  await redisClient.del(key);
}

/**
 * Delete multiple keys matching a pattern
 *
 * @param pattern - Glob pattern to match keys (e.g., "user:*")
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  if (!redisClient?.isOpen) {
    throw new Error('Redis client not connected');
  }

  const keys = await redisClient.keys(pattern);
  if (keys.length === 0) return 0;

  return await redisClient.del(keys);
}

/**
 * Check if a key exists in cache
 *
 * @param key - Cache key
 * @returns True if key exists
 */
export async function cacheExists(key: string): Promise<boolean> {
  if (!redisClient?.isOpen) {
    throw new Error('Redis client not connected');
  }

  const exists = await redisClient.exists(key);
  return exists === 1;
}

/**
 * Get or set cache value (cache-aside pattern)
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch data if not in cache
 * @param ttlSeconds - Time to live in seconds
 * @returns Cached or fetched value
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  await cacheSet(key, value, ttlSeconds);
  return value;
}

// ============================================
// SESSION UTILITIES
// ============================================

/**
 * Store a user session
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 * @param data - Session data
 * @param ttlSeconds - Session TTL (default 7 days)
 */
export async function storeSession(
  userId: string,
  sessionId: string,
  data: Record<string, unknown>,
  ttlSeconds: number = 7 * 24 * 60 * 60
): Promise<void> {
  const key = `session:${userId}:${sessionId}`;
  await cacheSet(key, { ...data, createdAt: new Date().toISOString() }, ttlSeconds);
}

/**
 * Get a user session
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 * @returns Session data or null
 */
export async function getSession(
  userId: string,
  sessionId: string
): Promise<Record<string, unknown> | null> {
  const key = `session:${userId}:${sessionId}`;
  return cacheGet(key);
}

/**
 * Delete a specific session
 *
 * @param userId - User ID
 * @param sessionId - Session ID
 */
export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const key = `session:${userId}:${sessionId}`;
  await cacheDelete(key);
}

/**
 * Delete all sessions for a user (logout from all devices)
 *
 * @param userId - User ID
 * @returns Number of sessions deleted
 */
export async function deleteAllUserSessions(userId: string): Promise<number> {
  return cacheDeletePattern(`session:${userId}:*`);
}

// ============================================
// RATE LIMITING UTILITIES
// ============================================

/**
 * Increment rate limit counter
 *
 * @param key - Rate limit key (e.g., "ratelimit:login:user@example.com")
 * @param windowSeconds - Time window in seconds
 * @param maxRequests - Maximum requests allowed in window
 * @returns Object with current count and whether limit is exceeded
 */
export async function checkRateLimit(
  key: string,
  windowSeconds: number,
  maxRequests: number
): Promise<{ count: number; exceeded: boolean; resetIn: number }> {
  if (!redisClient?.isOpen) {
    throw new Error('Redis client not connected');
  }

  const fullKey = `ratelimit:${key}`;

  const multi = redisClient.multi();
  multi.incr(fullKey);
  multi.ttl(fullKey);

  const results = await multi.exec();
  const count = results[0] as number;
  let ttl = results[1] as number;

  // Set expiry on first request
  if (ttl === -1) {
    await redisClient.expire(fullKey, windowSeconds);
    ttl = windowSeconds;
  }

  return {
    count,
    exceeded: count > maxRequests,
    resetIn: ttl,
  };
}

export default {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisConnected,
  redisHealthCheck,
  cacheSet,
  cacheGet,
  cacheDelete,
  cacheDeletePattern,
  cacheExists,
  cacheGetOrSet,
  storeSession,
  getSession,
  deleteSession,
  deleteAllUserSessions,
  checkRateLimit,
};
