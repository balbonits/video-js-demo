import { getClickHouse } from '../config/clickhouse';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import dayjs from 'dayjs';
import { EventEmitter } from 'events';

export interface AnalyticsEvent {
  event_id: string;
  event_type: string;
  user_id?: string;
  session_id?: string;
  video_id?: string;
  timestamp: Date;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface VideoMetrics {
  video_id: string;
  views: number;
  unique_viewers: number;
  watch_time_seconds: number;
  avg_watch_percentage: number;
  completion_rate: number;
  engagement_score: number;
  buffering_ratio: number;
  error_rate: number;
}

export interface RealtimeMetrics {
  concurrent_viewers: number;
  active_streams: number;
  bandwidth_gbps: number;
  events_per_second: number;
  error_rate: number;
}

export class AnalyticsService extends EventEmitter {
  private clickhouse = getClickHouse();
  private redis = getRedisClient();

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Store in ClickHouse for long-term analytics
      await this.clickhouse.insert({
        table: 'events',
        values: [event],
      });

      // Update real-time metrics in Redis
      await this.updateRealtimeMetrics(event);

      // Emit event for real-time dashboards
      this.emit('event', event);
    } catch (error) {
      logger.error('Failed to track event:', error);
      throw error;
    }
  }

  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    try {
      // Batch insert to ClickHouse
      await this.clickhouse.insert({
        table: 'events',
        values: events,
      });

      // Update real-time metrics
      for (const event of events) {
        await this.updateRealtimeMetrics(event);
      }
    } catch (error) {
      logger.error('Failed to track batch:', error);
      throw error;
    }
  }

  private async updateRealtimeMetrics(event: AnalyticsEvent): Promise<void> {
    const minute = dayjs().startOf('minute').unix();
    const hour = dayjs().startOf('hour').unix();

    // Update counters
    await this.redis.hincrby(`metrics:${minute}`, event.event_type, 1);
    await this.redis.expire(`metrics:${minute}`, 120); // 2 minutes

    // Update unique users
    if (event.user_id) {
      await this.redis.pfadd(`users:${hour}`, event.user_id);
      await this.redis.expire(`users:${hour}`, 3700); // ~1 hour
    }

    // Update video-specific metrics
    if (event.video_id) {
      await this.updateVideoMetrics(event);
    }
  }

  private async updateVideoMetrics(event: AnalyticsEvent): Promise<void> {
    const { video_id, event_type, properties } = event;
    const key = `video:${video_id}:metrics`;

    switch (event_type) {
      case 'video_start':
        await this.redis.hincrby(key, 'views', 1);
        break;
      case 'video_progress':
        const watchTime = properties.watch_time || 0;
        await this.redis.hincrbyfloat(key, 'watch_time', watchTime);
        break;
      case 'video_complete':
        await this.redis.hincrby(key, 'completions', 1);
        break;
      case 'video_error':
        await this.redis.hincrby(key, 'errors', 1);
        break;
      case 'video_buffer':
        await this.redis.hincrbyfloat(key, 'buffer_time', properties.duration || 0);
        break;
    }

    await this.redis.expire(key, 3600); // 1 hour
  }

  async getVideoMetrics(
    videoId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VideoMetrics> {
    const query = `
      SELECT
        video_id,
        count(DISTINCT session_id) as views,
        count(DISTINCT user_id) as unique_viewers,
        sum(properties['watch_time']) as watch_time_seconds,
        avg(properties['watch_percentage']) as avg_watch_percentage,
        countIf(event_type = 'video_complete') / countIf(event_type = 'video_start') as completion_rate,
        sum(properties['engagement_score']) / count() as engagement_score,
        sum(properties['buffer_time']) / sum(properties['watch_time']) as buffering_ratio,
        countIf(event_type = 'video_error') / count() as error_rate
      FROM events
      WHERE video_id = {videoId:String}
        AND timestamp >= {startDate:DateTime}
        AND timestamp <= {endDate:DateTime}
      GROUP BY video_id
    `;

    const result = await this.clickhouse.query({
      query,
      query_params: {
        videoId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    const data = await result.json();
    return data.data[0] || this.getEmptyMetrics(videoId);
  }

  async getRealtimeMetrics(): Promise<RealtimeMetrics> {
    const minute = dayjs().startOf('minute').unix();
    const hour = dayjs().startOf('hour').unix();

    // Get current metrics from Redis
    const [metrics, uniqueUsers, activeStreams] = await Promise.all([
      this.redis.hgetall(`metrics:${minute}`),
      this.redis.pfcount(`users:${hour}`),
      this.redis.scard('active_streams'),
    ]);

    // Calculate metrics
    const eventsPerSecond = Object.values(metrics)
      .reduce((sum, count) => sum + parseInt(count as string), 0) / 60;

    const errorCount = parseInt(metrics['video_error'] || '0');
    const totalEvents = Object.values(metrics)
      .reduce((sum, count) => sum + parseInt(count as string), 0);
    const errorRate = totalEvents > 0 ? errorCount / totalEvents : 0;

    // Get bandwidth from recent events
    const bandwidthQuery = `
      SELECT sum(properties['bytes_served']) / 1e9 as bandwidth_gbps
      FROM events
      WHERE event_type = 'segment_served'
        AND timestamp >= now() - INTERVAL 1 MINUTE
    `;

    const bandwidthResult = await this.clickhouse.query({ query: bandwidthQuery });
    const bandwidthData = await bandwidthResult.json();
    const bandwidth = bandwidthData.data[0]?.bandwidth_gbps || 0;

    return {
      concurrent_viewers: uniqueUsers,
      active_streams: activeStreams,
      bandwidth_gbps: bandwidth,
      events_per_second: eventsPerSecond,
      error_rate: errorRate,
    };
  }

  async getTopVideos(
    limit: number = 10,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<any[]> {
    const startDate = dayjs().subtract(1, timeRange).toDate();

    const query = `
      SELECT
        video_id,
        count(DISTINCT session_id) as views,
        count(DISTINCT user_id) as unique_viewers,
        avg(properties['watch_percentage']) as avg_watch_percentage,
        sum(properties['watch_time']) as total_watch_time
      FROM events
      WHERE event_type IN ('video_start', 'video_progress', 'video_complete')
        AND timestamp >= {startDate:DateTime}
      GROUP BY video_id
      ORDER BY views DESC
      LIMIT {limit:UInt32}
    `;

    const result = await this.clickhouse.query({
      query,
      query_params: {
        startDate: startDate.toISOString(),
        limit,
      },
    });

    const data = await result.json();
    return data.data;
  }

  async getUserEngagement(userId: string): Promise<any> {
    const query = `
      SELECT
        count(DISTINCT video_id) as videos_watched,
        count(DISTINCT DATE(timestamp)) as active_days,
        sum(properties['watch_time']) as total_watch_time,
        avg(properties['watch_percentage']) as avg_watch_percentage,
        countIf(event_type = 'video_complete') as videos_completed,
        countIf(event_type = 'video_like') as videos_liked,
        countIf(event_type = 'video_share') as videos_shared
      FROM events
      WHERE user_id = {userId:String}
        AND timestamp >= now() - INTERVAL 30 DAY
    `;

    const result = await this.clickhouse.query({
      query,
      query_params: { userId },
    });

    const data = await result.json();
    return data.data[0];
  }

  async getSystemHealth(): Promise<any> {
    const query = `
      SELECT
        toStartOfMinute(timestamp) as minute,
        countIf(event_type = 'video_error') as errors,
        countIf(event_type = 'video_buffer') as buffer_events,
        avg(properties['latency']) as avg_latency,
        quantile(0.95)(properties['latency']) as p95_latency,
        quantile(0.99)(properties['latency']) as p99_latency
      FROM events
      WHERE timestamp >= now() - INTERVAL 1 HOUR
      GROUP BY minute
      ORDER BY minute DESC
    `;

    const result = await this.clickhouse.query({ query });
    const data = await result.json();
    return data.data;
  }

  private getEmptyMetrics(videoId: string): VideoMetrics {
    return {
      video_id: videoId,
      views: 0,
      unique_viewers: 0,
      watch_time_seconds: 0,
      avg_watch_percentage: 0,
      completion_rate: 0,
      engagement_score: 0,
      buffering_ratio: 0,
      error_rate: 0,
    };
  }
}

export const analyticsService = new AnalyticsService();