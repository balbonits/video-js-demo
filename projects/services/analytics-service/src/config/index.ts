import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3002),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_POOL_MIN: Joi.number().default(2),
  DATABASE_POOL_MAX: Joi.number().default(10),

  // ClickHouse
  CLICKHOUSE_HOST: Joi.string().required(),
  CLICKHOUSE_PORT: Joi.number().default(8123),
  CLICKHOUSE_DATABASE: Joi.string().default('analytics'),
  CLICKHOUSE_USER: Joi.string().default('default'),
  CLICKHOUSE_PASSWORD: Joi.string().allow('').default(''),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(1),

  // Kafka
  KAFKA_BROKERS: Joi.string().required(),
  KAFKA_CLIENT_ID: Joi.string().default('analytics-service'),
  KAFKA_GROUP_ID: Joi.string().default('analytics-consumers'),
  KAFKA_TOPICS: Joi.string().default('video-events,user-events,system-events'),

  // WebSocket
  WS_PORT: Joi.number().default(3003),
  WS_PATH: Joi.string().default('/ws'),
  WS_PING_INTERVAL: Joi.number().default(30000),

  // Aggregation
  AGGREGATION_INTERVAL: Joi.number().default(60000),
  RETENTION_DAYS: Joi.number().default(90),
  BATCH_SIZE: Joi.number().default(1000),

  // Security
  JWT_SECRET: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default('*'),

  // Monitoring
  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().default(9091),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  server: {
    port: envVars.PORT,
    host: envVars.HOST,
  },
  database: {
    url: envVars.DATABASE_URL,
    pool: {
      min: envVars.DATABASE_POOL_MIN,
      max: envVars.DATABASE_POOL_MAX,
    },
  },
  clickhouse: {
    host: envVars.CLICKHOUSE_HOST,
    port: envVars.CLICKHOUSE_PORT,
    database: envVars.CLICKHOUSE_DATABASE,
    username: envVars.CLICKHOUSE_USER,
    password: envVars.CLICKHOUSE_PASSWORD,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
  },
  kafka: {
    brokers: envVars.KAFKA_BROKERS.split(','),
    clientId: envVars.KAFKA_CLIENT_ID,
    groupId: envVars.KAFKA_GROUP_ID,
    topics: envVars.KAFKA_TOPICS.split(','),
  },
  websocket: {
    port: envVars.WS_PORT,
    path: envVars.WS_PATH,
    pingInterval: envVars.WS_PING_INTERVAL,
  },
  aggregation: {
    interval: envVars.AGGREGATION_INTERVAL,
    retentionDays: envVars.RETENTION_DAYS,
    batchSize: envVars.BATCH_SIZE,
  },
  security: {
    jwtSecret: envVars.JWT_SECRET,
    corsOrigin: envVars.CORS_ORIGIN,
  },
  metrics: {
    enabled: envVars.METRICS_ENABLED,
    port: envVars.METRICS_PORT,
  },
  logging: {
    level: envVars.LOG_LEVEL,
  },
};