import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { uploadFile, getFileUrl, deleteFile } from '../config/storage';
import { addTranscodingJob } from '../services/queueService';
import { transcodingService } from '../services/transcodingService';
import { getDatabase } from '../config/database';
import { config } from '../config';
import { logger } from '../utils/logger';

class VideoController {
  async uploadVideo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
      }

      const videoId = uuidv4();
      const { originalname, path: tempPath, size } = req.file;
      const userId = (req as any).user?.id || 'anonymous';

      // Get video metadata
      const metadata = await transcodingService.getVideoMetadata(tempPath);

      // Upload original file to storage
      const fileContent = await fs.readFile(tempPath);
      const objectName = `videos/${videoId}/original.${originalname.split('.').pop()}`;

      await uploadFile(
        config.storage.minio.bucketName,
        objectName,
        fileContent,
        size,
        {
          'Content-Type': req.file.mimetype,
          'x-video-id': videoId,
          'x-original-name': originalname,
        }
      );

      // Save to database
      const db = getDatabase();
      await db('videos').insert({
        id: videoId,
        user_id: userId,
        title: originalname,
        original_path: objectName,
        size,
        duration: metadata.duration,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        codec: metadata.codec,
        bitrate: metadata.bitrate,
        fps: metadata.fps,
        status: 'uploaded',
        created_at: new Date(),
      });

      // Clean up temp file
      await fs.unlink(tempPath);

      res.status(201).json({
        videoId,
        message: 'Video uploaded successfully',
        metadata,
      });
    } catch (error) {
      logger.error('Video upload failed:', error);
      next(error);
    }
  }

  async getVideoMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const db = getDatabase();
      const video = await db('videos').where({ id }).first();

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      res.json({
        id: video.id,
        title: video.title,
        duration: video.duration,
        resolution: `${video.width}x${video.height}`,
        format: video.format,
        codec: video.codec,
        bitrate: video.bitrate,
        fps: video.fps,
        size: video.size,
        status: video.status,
        createdAt: video.created_at,
      });
    } catch (error) {
      logger.error('Failed to get video metadata:', error);
      next(error);
    }
  }

  async startTranscoding(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        profiles = ['720p', '480p'],
        generateHLS = true,
        generateDASH = false,
        generateThumbnails = true,
      } = req.body;

      const db = getDatabase();
      const video = await db('videos').where({ id }).first();

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      if (video.status === 'processing') {
        return res.status(409).json({ error: 'Video is already being processed' });
      }

      // Download original file to temp location
      const tempPath = `/tmp/${uuidv4()}_${path.basename(video.original_path)}`;
      const stream = await (await fetch(
        await getFileUrl(config.storage.minio.bucketName, video.original_path)
      )).arrayBuffer();
      await fs.writeFile(tempPath, Buffer.from(stream));

      // Add transcoding job to queue
      const jobId = await addTranscodingJob({
        videoId: id,
        inputPath: tempPath,
        profiles,
        generateHLS,
        generateDASH,
        generateThumbnails,
      });

      // Update video status
      await db('videos').where({ id }).update({
        status: 'processing',
        job_id: jobId,
        updated_at: new Date(),
      });

      res.json({
        message: 'Transcoding job started',
        jobId,
      });
    } catch (error) {
      logger.error('Failed to start transcoding:', error);
      next(error);
    }
  }

  async getThumbnails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const db = getDatabase();
      const thumbnails = await db('video_thumbnails').where({ video_id: id });

      if (thumbnails.length === 0) {
        return res.status(404).json({ error: 'No thumbnails found' });
      }

      const urls = await Promise.all(
        thumbnails.map(async (thumb) => ({
          id: thumb.id,
          url: await getFileUrl(config.storage.minio.bucketName, thumb.path),
          timestamp: thumb.timestamp,
        }))
      );

      res.json({ thumbnails: urls });
    } catch (error) {
      logger.error('Failed to get thumbnails:', error);
      next(error);
    }
  }

  async getPreview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const db = getDatabase();
      const video = await db('videos').where({ id }).first();

      if (!video || !video.preview_path) {
        return res.status(404).json({ error: 'Preview not found' });
      }

      const url = await getFileUrl(config.storage.minio.bucketName, video.preview_path);
      res.redirect(url);
    } catch (error) {
      logger.error('Failed to get preview:', error);
      next(error);
    }
  }

  async deleteVideo(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const db = getDatabase();
      const video = await db('videos').where({ id }).first();

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Delete all associated files from storage
      const filesToDelete = [video.original_path];

      // Get all transcoded versions
      const versions = await db('video_versions').where({ video_id: id });
      filesToDelete.push(...versions.map((v) => v.path));

      // Get all thumbnails
      const thumbnails = await db('video_thumbnails').where({ video_id: id });
      filesToDelete.push(...thumbnails.map((t) => t.path));

      // Delete from storage
      await Promise.all(
        filesToDelete.map((file) =>
          deleteFile(config.storage.minio.bucketName, file).catch((err) =>
            logger.error(`Failed to delete file ${file}:`, err)
          )
        )
      );

      // Delete from database
      await db('videos').where({ id }).delete();

      res.json({ message: 'Video deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete video:', error);
      next(error);
    }
  }
}

export const videoController = new VideoController();