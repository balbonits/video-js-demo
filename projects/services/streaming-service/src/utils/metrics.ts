import { Express, Request, Response, NextFunction } from 'express';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { config } from '../config';

// Collect default metrics
collectDefaultMetrics({ prefix: 'streaming_service_' });

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'streaming_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

export const httpRequestTotal = new Counter({
  name: 'streaming_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

export const activeTranscodingJobs = new Gauge({
  name: 'streaming_service_active_transcoding_jobs',
  help: 'Number of active transcoding jobs',
});

export const videosUploaded = new Counter({
  name: 'streaming_service_videos_uploaded_total',
  help: 'Total number of videos uploaded',
});

export const streamingBandwidth = new Counter({
  name: 'streaming_service_bandwidth_bytes_total',
  help: 'Total bandwidth served in bytes',
  labelNames: ['type'], // 'hls' or 'dash'
});

export const transcodingDuration = new Histogram({
  name: 'streaming_service_transcoding_duration_seconds',
  help: 'Duration of transcoding jobs in seconds',
  labelNames: ['profile'],
  buckets: [30, 60, 120, 300, 600, 1200, 3600],
});

export const storageUsage = new Gauge({
  name: 'streaming_service_storage_usage_bytes',
  help: 'Current storage usage in bytes',
  labelNames: ['type'], // 'original', 'transcoded', 'thumbnails'
});

// Middleware to track HTTP metrics
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || 'unknown';
    const labels = {
      method: req.method,
      route,
      status: res.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });

  next();
}

// Setup metrics endpoint
export function setupMetrics(app: Express): void {
  app.get('/metrics', async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', register.contentType);
      const metrics = await register.metrics();
      res.send(metrics);
    } catch (error) {
      res.status(500).send('Error collecting metrics');
    }
  });
}