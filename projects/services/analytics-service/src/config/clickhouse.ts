import { createClient } from '@clickhouse/client';
import { config } from './index';
import { logger } from '../utils/logger';

let clickhouseClient: any;

export async function initializeClickHouse() {
  try {
    clickhouseClient = createClient({
      host: `http://${config.clickhouse.host}:${config.clickhouse.port}`,
      database: config.clickhouse.database,
      username: config.clickhouse.username,
      password: config.clickhouse.password,
    });

    // Create tables if they don't exist
    await createTables();

    logger.info('ClickHouse initialized');
  } catch (error) {
    logger.error('ClickHouse initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS events (
      event_id UUID,
      event_type String,
      user_id Nullable(String),
      session_id Nullable(String),
      video_id Nullable(String),
      timestamp DateTime,
      properties String,
      metadata Nullable(String)
    ) ENGINE = MergeTree()
    ORDER BY (event_type, timestamp)
    PARTITION BY toYYYYMM(timestamp)`,

    `CREATE TABLE IF NOT EXISTS video_metrics (
      video_id String,
      date Date,
      views UInt32,
      unique_viewers UInt32,
      watch_time_seconds Float64,
      avg_watch_percentage Float32,
      completion_rate Float32,
      engagement_score Float32,
      buffering_ratio Float32,
      error_rate Float32
    ) ENGINE = SummingMergeTree()
    ORDER BY (video_id, date)
    PARTITION BY toYYYYMM(date)`,

    `CREATE TABLE IF NOT EXISTS user_sessions (
      session_id UUID,
      user_id String,
      start_time DateTime,
      end_time Nullable(DateTime),
      events_count UInt32,
      videos_watched Array(String),
      total_watch_time Float64
    ) ENGINE = MergeTree()
    ORDER BY (user_id, start_time)
    PARTITION BY toYYYYMM(start_time)`
  ];

  for (const query of queries) {
    try {
      await clickhouseClient.query({ query });
    } catch (error) {
      logger.error('Failed to create ClickHouse table:', error);
    }
  }
}

export function getClickHouse() {
  if (!clickhouseClient) {
    throw new Error('ClickHouse not initialized');
  }
  return clickhouseClient;
}