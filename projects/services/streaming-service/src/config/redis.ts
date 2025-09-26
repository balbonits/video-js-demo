import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis;
let redisSubscriber: Redis;
let redisPublisher: Redis;

export async function initializeRedis(): Promise<void> {
  const redisConfig = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    db: config.redis.db,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  };

  try {
    // Create Redis clients
    redisClient = new Redis(redisConfig);
    redisSubscriber = new Redis(redisConfig);
    redisPublisher = new Redis(redisConfig);

    // Handle connection events
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    // Test connection
    await redisClient.ping();
  } catch (error) {
    logger.error('Redis initialization failed:', error);
    throw error;
  }
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    throw new Error('Redis subscriber not initialized');
  }
  return redisSubscriber;
}

export function getRedisPublisher(): Redis {
  if (!redisPublisher) {
    throw new Error('Redis publisher not initialized');
  }
  return redisPublisher;
}

export async function closeRedis(): Promise<void> {
  const clients = [redisClient, redisSubscriber, redisPublisher];
  await Promise.all(
    clients.map(client => client?.quit())
  );
}