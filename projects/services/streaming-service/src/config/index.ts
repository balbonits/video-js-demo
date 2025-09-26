import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  HOST: Joi.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: Joi.string().required(),
  DATABASE_POOL_MIN: Joi.number().default(2),
  DATABASE_POOL_MAX: Joi.number().default(10),

  // Redis
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),

  // Storage
  STORAGE_TYPE: Joi.string().valid('minio', 's3', 'local').default('minio'),
  MINIO_ENDPOINT: Joi.string().when('STORAGE_TYPE', { is: 'minio', then: Joi.required() }),
  MINIO_PORT: Joi.number().default(9000),
  MINIO_USE_SSL: Joi.boolean().default(false),
  MINIO_ACCESS_KEY: Joi.string().when('STORAGE_TYPE', { is: 'minio', then: Joi.required() }),
  MINIO_SECRET_KEY: Joi.string().when('STORAGE_TYPE', { is: 'minio', then: Joi.required() }),
  MINIO_BUCKET_NAME: Joi.string().default('streaming-videos'),

  // CDN
  CDN_BASE_URL: Joi.string().uri().required(),
  CDN_SECRET_KEY: Joi.string().required(),

  // Streaming
  HLS_SEGMENT_DURATION: Joi.number().default(10),
  HLS_PLAYLIST_SIZE: Joi.number().default(5),
  DASH_SEGMENT_DURATION: Joi.number().default(4),
  MAX_UPLOAD_SIZE: Joi.number().default(5368709120), // 5GB
  SUPPORTED_FORMATS: Joi.string().default('mp4,mkv,avi,mov,webm'),

  // Transcoding
  FFMPEG_THREADS: Joi.number().default(4),
  TRANSCODING_PROFILES: Joi.string().default('360p,480p,720p,1080p'),
  ENABLE_4K: Joi.boolean().default(false),

  // Queue
  QUEUE_CONCURRENCY: Joi.number().default(2),
  QUEUE_MAX_JOBS: Joi.number().default(100),

  // Security
  JWT_SECRET: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default('*'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // Monitoring
  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().default(9090),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json'),
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
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
  },
  storage: {
    type: envVars.STORAGE_TYPE,
    minio: {
      endpoint: envVars.MINIO_ENDPOINT,
      port: envVars.MINIO_PORT,
      useSSL: envVars.MINIO_USE_SSL,
      accessKey: envVars.MINIO_ACCESS_KEY,
      secretKey: envVars.MINIO_SECRET_KEY,
      bucketName: envVars.MINIO_BUCKET_NAME,
    },
  },
  cdn: {
    baseUrl: envVars.CDN_BASE_URL,
    secretKey: envVars.CDN_SECRET_KEY,
  },
  streaming: {
    hls: {
      segmentDuration: envVars.HLS_SEGMENT_DURATION,
      playlistSize: envVars.HLS_PLAYLIST_SIZE,
    },
    dash: {
      segmentDuration: envVars.DASH_SEGMENT_DURATION,
    },
    maxUploadSize: envVars.MAX_UPLOAD_SIZE,
    supportedFormats: envVars.SUPPORTED_FORMATS.split(','),
  },
  transcoding: {
    ffmpegThreads: envVars.FFMPEG_THREADS,
    profiles: envVars.TRANSCODING_PROFILES.split(','),
    enable4K: envVars.ENABLE_4K,
  },
  queue: {
    concurrency: envVars.QUEUE_CONCURRENCY,
    maxJobs: envVars.QUEUE_MAX_JOBS,
  },
  security: {
    jwtSecret: envVars.JWT_SECRET,
    corsOrigin: envVars.CORS_ORIGIN,
    rateLimit: {
      windowMs: envVars.RATE_LIMIT_WINDOW_MS,
      maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
    },
  },
  metrics: {
    enabled: envVars.METRICS_ENABLED,
    port: envVars.METRICS_PORT,
  },
  logging: {
    level: envVars.LOG_LEVEL,
    format: envVars.LOG_FORMAT,
  },
};

export const transcodingProfiles = {
  '360p': {
    resolution: '640x360',
    videoBitrate: '800k',
    audioBitrate: '96k',
    maxRate: '856k',
    bufSize: '1200k',
  },
  '480p': {
    resolution: '854x480',
    videoBitrate: '1400k',
    audioBitrate: '128k',
    maxRate: '1498k',
    bufSize: '2100k',
  },
  '720p': {
    resolution: '1280x720',
    videoBitrate: '2800k',
    audioBitrate: '128k',
    maxRate: '2996k',
    bufSize: '4200k',
  },
  '1080p': {
    resolution: '1920x1080',
    videoBitrate: '5000k',
    audioBitrate: '192k',
    maxRate: '5350k',
    bufSize: '7500k',
  },
  '4k': {
    resolution: '3840x2160',
    videoBitrate: '15000k',
    audioBitrate: '192k',
    maxRate: '16050k',
    bufSize: '22500k',
  },
};