import { FastifyInstance } from 'fastify';
import { analyticsService } from '../services/analyticsService';

export function setupRoutes(fastify: FastifyInstance) {
  // Track event
  fastify.post('/api/events', async (request, reply) => {
    const event = request.body as any;
    await analyticsService.trackEvent(event);
    return { success: true };
  });

  // Track batch
  fastify.post('/api/events/batch', async (request, reply) => {
    const events = request.body as any[];
    await analyticsService.trackBatch(events);
    return { success: true, count: events.length };
  });

  // Get video metrics
  fastify.get('/api/metrics/video/:videoId', async (request, reply) => {
    const { videoId } = request.params as any;
    const { startDate, endDate } = request.query as any;

    const metrics = await analyticsService.getVideoMetrics(
      videoId,
      new Date(startDate || Date.now() - 86400000),
      new Date(endDate || Date.now())
    );

    return metrics;
  });

  // Get real-time metrics
  fastify.get('/api/metrics/realtime', async (request, reply) => {
    const metrics = await analyticsService.getRealtimeMetrics();
    return metrics;
  });

  // Get top videos
  fastify.get('/api/metrics/top-videos', async (request, reply) => {
    const { limit, timeRange } = request.query as any;
    const videos = await analyticsService.getTopVideos(limit, timeRange);
    return { videos };
  });

  // Get user engagement
  fastify.get('/api/metrics/user/:userId', async (request, reply) => {
    const { userId } = request.params as any;
    const engagement = await analyticsService.getUserEngagement(userId);
    return engagement;
  });

  // Get system health
  fastify.get('/api/metrics/health', async (request, reply) => {
    const health = await analyticsService.getSystemHealth();
    return { health };
  });
}