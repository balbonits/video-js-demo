import { Express, Router } from 'express';
import { videoRoutes } from './videoRoutes';
import { streamRoutes } from './streamRoutes';
import { jobRoutes } from './jobRoutes';

export function setupRoutes(app: Express): void {
  const apiRouter = Router();

  // Mount route modules
  apiRouter.use('/videos', videoRoutes);
  apiRouter.use('/stream', streamRoutes);
  apiRouter.use('/jobs', jobRoutes);

  // API documentation endpoint
  apiRouter.get('/', (req, res) => {
    res.json({
      name: 'Streaming Service API',
      version: '1.0.0',
      endpoints: {
        videos: {
          upload: 'POST /api/videos/upload',
          metadata: 'GET /api/videos/:id/metadata',
          transcode: 'POST /api/videos/:id/transcode',
          thumbnails: 'GET /api/videos/:id/thumbnails',
          preview: 'GET /api/videos/:id/preview',
        },
        streaming: {
          hls: 'GET /api/stream/:id/hls/playlist.m3u8',
          dash: 'GET /api/stream/:id/dash/manifest.mpd',
          segment: 'GET /api/stream/:id/:type/:segment',
        },
        jobs: {
          status: 'GET /api/jobs/:id',
          metrics: 'GET /api/jobs/metrics',
        },
      },
    });
  });

  // Mount API router
  app.use('/api', apiRouter);
}