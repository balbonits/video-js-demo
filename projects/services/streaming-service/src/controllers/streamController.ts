import { Request, Response, NextFunction } from 'express';
import { downloadFile, getFileUrl } from '../config/storage';
import { getDatabase } from '../config/database';
import { getRedisClient } from '../config/redis';
import { config } from '../config';
import { logger } from '../utils/logger';

class StreamController {
  private redis = getRedisClient();

  async getHLSPlaylist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { quality = '720p' } = req.query;

      const db = getDatabase();
      const video = await db('videos').where({ id }).first();

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Check if HLS playlist exists
      const hlsPath = `streams/${id}/hls/${quality}/playlist.m3u8`;
      const cacheKey = `hls:${id}:${quality}`;

      // Check cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'max-age=3600');
        return res.send(cached);
      }

      // Get playlist from storage
      const stream = await downloadFile(config.storage.minio.bucketName, hlsPath);
      const chunks: Buffer[] = [];

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', async () => {
        const playlist = Buffer.concat(chunks).toString();

        // Update URLs to point to our CDN
        const updatedPlaylist = playlist.replace(
          /segment_(\d+)\.ts/g,
          `${config.cdn.baseUrl}/api/stream/${id}/hls/segment_$1.ts`
        );

        // Cache for 1 hour
        await this.redis.setex(cacheKey, 3600, updatedPlaylist);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'max-age=3600');
        res.send(updatedPlaylist);
      });

      stream.on('error', (error) => {
        logger.error('Failed to get HLS playlist:', error);
        res.status(404).json({ error: 'Playlist not found' });
      });
    } catch (error) {
      logger.error('Failed to get HLS playlist:', error);
      next(error);
    }
  }

  async getHLSSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, segment } = req.params;
      const { quality = '720p' } = req.query;

      const segmentPath = `streams/${id}/hls/${quality}/${segment}`;
      const url = await getFileUrl(config.storage.minio.bucketName, segmentPath);

      // Set appropriate headers for video segment
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'max-age=31536000'); // 1 year
      res.redirect(url);
    } catch (error) {
      logger.error('Failed to get HLS segment:', error);
      next(error);
    }
  }

  async getDASHManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const db = getDatabase();
      const video = await db('videos').where({ id }).first();

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Check if DASH manifest exists
      const dashPath = `streams/${id}/dash/manifest.mpd`;
      const cacheKey = `dash:${id}:manifest`;

      // Check cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        res.setHeader('Content-Type', 'application/dash+xml');
        res.setHeader('Cache-Control', 'max-age=3600');
        return res.send(cached);
      }

      // Get manifest from storage
      const stream = await downloadFile(config.storage.minio.bucketName, dashPath);
      const chunks: Buffer[] = [];

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', async () => {
        const manifest = Buffer.concat(chunks).toString();

        // Update URLs to point to our CDN
        const updatedManifest = manifest.replace(
          /segment_(\d+)\.m4s/g,
          `${config.cdn.baseUrl}/api/stream/${id}/dash/segment_$1.m4s`
        );

        // Cache for 1 hour
        await this.redis.setex(cacheKey, 3600, updatedManifest);

        res.setHeader('Content-Type', 'application/dash+xml');
        res.setHeader('Cache-Control', 'max-age=3600');
        res.send(updatedManifest);
      });

      stream.on('error', (error) => {
        logger.error('Failed to get DASH manifest:', error);
        res.status(404).json({ error: 'Manifest not found' });
      });
    } catch (error) {
      logger.error('Failed to get DASH manifest:', error);
      next(error);
    }
  }

  async getDASHSegment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, segment } = req.params;

      const segmentPath = `streams/${id}/dash/${segment}`;
      const url = await getFileUrl(config.storage.minio.bucketName, segmentPath);

      // Set appropriate headers for video segment
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Cache-Control', 'max-age=31536000'); // 1 year
      res.redirect(url);
    } catch (error) {
      logger.error('Failed to get DASH segment:', error);
      next(error);
    }
  }

  async getABRManifest(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const db = getDatabase();
      const video = await db('videos').where({ id }).first();

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Get all available qualities
      const versions = await db('video_versions')
        .where({ video_id: id })
        .orderBy('bitrate', 'desc');

      if (versions.length === 0) {
        return res.status(404).json({ error: 'No versions available' });
      }

      // Generate master playlist for adaptive bitrate streaming
      let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';

      for (const version of versions) {
        const bandwidth = version.bitrate;
        const resolution = `${version.width}x${version.height}`;
        const profile = version.profile;

        masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n`;
        masterPlaylist += `${config.cdn.baseUrl}/api/stream/${id}/hls/playlist.m3u8?quality=${profile}\n`;
      }

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'max-age=3600');
      res.send(masterPlaylist);
    } catch (error) {
      logger.error('Failed to generate ABR manifest:', error);
      next(error);
    }
  }
}

export const streamController = new StreamController();