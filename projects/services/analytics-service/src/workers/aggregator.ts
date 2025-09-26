import cron from 'node-cron';
import { getClickHouse } from '../config/clickhouse';
import { logger } from '../utils/logger';
import { config } from '../config';

export function startAggregator() {
  // Aggregate video metrics every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await aggregateVideoMetrics();
    } catch (error) {
      logger.error('Video metrics aggregation failed:', error);
    }
  });

  // Clean up old data daily
  cron.schedule('0 0 * * *', async () => {
    try {
      await cleanupOldData();
    } catch (error) {
      logger.error('Data cleanup failed:', error);
    }
  });

  logger.info('Aggregator started');
}

async function aggregateVideoMetrics() {
  const clickhouse = getClickHouse();

  const query = `
    INSERT INTO video_metrics
    SELECT
      video_id,
      toDate(timestamp) as date,
      count(DISTINCT session_id) as views,
      count(DISTINCT user_id) as unique_viewers,
      sum(JSONExtractFloat(properties, 'watch_time')) as watch_time_seconds,
      avg(JSONExtractFloat(properties, 'watch_percentage')) as avg_watch_percentage,
      countIf(event_type = 'video_complete') / countIf(event_type = 'video_start') as completion_rate,
      avg(JSONExtractFloat(properties, 'engagement_score')) as engagement_score,
      sum(JSONExtractFloat(properties, 'buffer_time')) / sum(JSONExtractFloat(properties, 'watch_time')) as buffering_ratio,
      countIf(event_type = 'video_error') / count() as error_rate
    FROM events
    WHERE timestamp >= now() - INTERVAL 1 HOUR
      AND timestamp < now()
    GROUP BY video_id, date
  `;

  await clickhouse.query({ query });
  logger.info('Video metrics aggregated');
}

async function cleanupOldData() {
  const clickhouse = getClickHouse();
  const retentionDays = config.aggregation.retentionDays;

  const queries = [
    `ALTER TABLE events DELETE WHERE timestamp < now() - INTERVAL ${retentionDays} DAY`,
    `ALTER TABLE video_metrics DELETE WHERE date < today() - ${retentionDays}`,
    `ALTER TABLE user_sessions DELETE WHERE start_time < now() - INTERVAL ${retentionDays} DAY`,
  ];

  for (const query of queries) {
    await clickhouse.query({ query });
  }

  logger.info(`Cleaned up data older than ${retentionDays} days`);
}