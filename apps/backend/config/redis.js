import Redis from 'ioredis';

let redis = null;

export const connectRedis = async () => {
  try {
    redis = new Redis(process.env.REDIS_URL, { maxRetriesPerAttempt: 1, retryStrategy: () => null });
    redis.on('connect', () => console.log('Redis connected'));
    redis.on('error', (err) => console.error('Redis error:', err.message));
  } catch (error) {
    console.error('Redis connection failed, continuing without cache');
  }
};

export const getRedis = () => redis;

export const getOrSetCache = async (key, cb, ttl = 3600) => {
  if (!redis) return cb();
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    const fresh = await cb();
    await redis.set(key, JSON.stringify(fresh), 'EX', ttl);
    return fresh;
  } catch {
    return cb();
  }
};

export const clearCache = async (pattern) => {
  if (!redis) return;
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(keys);
};
