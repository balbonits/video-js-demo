import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config';
import { getRedisClient } from '../config/redis';
import { transcodingService } from './transcodingService';
import { uploadFile } from '../config/storage';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs/promises';

interface TranscodingJobData {
  videoId: string;
  inputPath: string;
  profiles: string[];
  generateHLS: boolean;
  generateDASH: boolean;
  generateThumbnails: boolean;
}

let transcodingQueue: Queue<TranscodingJobData>;
let transcodingWorker: Worker<TranscodingJobData>;

export async function initializeQueue(): Promise<void> {
  const connection = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
  };

  // Create queue
  transcodingQueue = new Queue('transcoding', { connection });

  // Create worker
  transcodingWorker = new Worker(
    'transcoding',
    async (job: Job<TranscodingJobData>) => {
      return await processTranscodingJob(job);
    },
    {
      connection,
      concurrency: config.queue.concurrency,
    }
  );

  // Worker event handlers
  transcodingWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  transcodingWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  transcodingWorker.on('error', (err) => {
    logger.error('Worker error:', err);
  });
}

async function processTranscodingJob(job: Job<TranscodingJobData>) {
  const { videoId, inputPath, profiles, generateHLS, generateDASH, generateThumbnails } = job.data;
  const results: any = {
    videoId,
    transcodedFiles: [],
    hls: null,
    dash: null,
    thumbnails: [],
  };

  try {
    // Update job progress
    await job.updateProgress(10);

    // Get video metadata
    const metadata = await transcodingService.getVideoMetadata(inputPath);
    results.metadata = metadata;

    // Transcode to different profiles
    if (profiles.length > 0) {
      const progressPerProfile = 30 / profiles.length;
      let currentProgress = 10;

      for (const profile of profiles) {
        logger.info(`Transcoding video ${videoId} to ${profile}`);
        const outputPath = await transcodingService.transcodeVideo(
          inputPath,
          profile,
          job.id!
        );

        // Upload to storage
        const stream = await fs.readFile(outputPath);
        const objectName = `videos/${videoId}/${profile}.mp4`;
        await uploadFile(
          config.storage.minio.bucketName,
          objectName,
          stream,
          stream.length,
          {
            'Content-Type': 'video/mp4',
            'x-video-id': videoId,
            'x-profile': profile,
          }
        );

        results.transcodedFiles.push({
          profile,
          path: objectName,
          size: stream.length,
        });

        // Clean up temp file
        await fs.unlink(outputPath);

        currentProgress += progressPerProfile;
        await job.updateProgress(currentProgress);
      }
    }

    // Generate HLS
    if (generateHLS) {
      logger.info(`Generating HLS for video ${videoId}`);
      const { playlistPath, segmentPaths } = await transcodingService.generateHLS(
        inputPath,
        job.id!
      );

      // Upload playlist and segments
      const playlistContent = await fs.readFile(playlistPath);
      const playlistObjectName = `streams/${videoId}/hls/playlist.m3u8`;
      await uploadFile(
        config.storage.minio.bucketName,
        playlistObjectName,
        playlistContent,
        playlistContent.length,
        { 'Content-Type': 'application/x-mpegURL' }
      );

      const segmentObjectNames: string[] = [];
      for (const segmentPath of segmentPaths) {
        const segmentContent = await fs.readFile(segmentPath);
        const segmentName = path.basename(segmentPath);
        const segmentObjectName = `streams/${videoId}/hls/${segmentName}`;

        await uploadFile(
          config.storage.minio.bucketName,
          segmentObjectName,
          segmentContent,
          segmentContent.length,
          { 'Content-Type': 'video/mp2t' }
        );

        segmentObjectNames.push(segmentObjectName);
        await fs.unlink(segmentPath);
      }

      await fs.unlink(playlistPath);
      await fs.rmdir(path.dirname(playlistPath));

      results.hls = {
        playlist: playlistObjectName,
        segments: segmentObjectNames,
      };

      await job.updateProgress(70);
    }

    // Generate DASH
    if (generateDASH) {
      logger.info(`Generating DASH for video ${videoId}`);
      const { manifestPath, segmentPaths } = await transcodingService.generateDASH(
        inputPath,
        job.id!
      );

      // Upload manifest and segments
      const manifestContent = await fs.readFile(manifestPath);
      const manifestObjectName = `streams/${videoId}/dash/manifest.mpd`;
      await uploadFile(
        config.storage.minio.bucketName,
        manifestObjectName,
        manifestContent,
        manifestContent.length,
        { 'Content-Type': 'application/dash+xml' }
      );

      const segmentObjectNames: string[] = [];
      for (const segmentPath of segmentPaths) {
        const segmentContent = await fs.readFile(segmentPath);
        const segmentName = path.basename(segmentPath);
        const segmentObjectName = `streams/${videoId}/dash/${segmentName}`;

        await uploadFile(
          config.storage.minio.bucketName,
          segmentObjectName,
          segmentContent,
          segmentContent.length,
          { 'Content-Type': 'video/mp4' }
        );

        segmentObjectNames.push(segmentObjectName);
        await fs.unlink(segmentPath);
      }

      await fs.unlink(manifestPath);
      await fs.rmdir(path.dirname(manifestPath));

      results.dash = {
        manifest: manifestObjectName,
        segments: segmentObjectNames,
      };

      await job.updateProgress(85);
    }

    // Generate thumbnails
    if (generateThumbnails) {
      logger.info(`Generating thumbnails for video ${videoId}`);
      const thumbnailPaths = await transcodingService.generateThumbnails(inputPath);

      for (let i = 0; i < thumbnailPaths.length; i++) {
        const thumbPath = thumbnailPaths[i];
        const thumbContent = await fs.readFile(thumbPath);
        const thumbObjectName = `thumbnails/${videoId}/thumb_${i}.jpg`;

        await uploadFile(
          config.storage.minio.bucketName,
          thumbObjectName,
          thumbContent,
          thumbContent.length,
          { 'Content-Type': 'image/jpeg' }
        );

        results.thumbnails.push(thumbObjectName);
        await fs.unlink(thumbPath);
      }

      await job.updateProgress(95);
    }

    // Generate preview video
    logger.info(`Generating preview for video ${videoId}`);
    const previewPath = await transcodingService.generatePreviewVideo(inputPath);
    const previewContent = await fs.readFile(previewPath);
    const previewObjectName = `previews/${videoId}/preview.mp4`;

    await uploadFile(
      config.storage.minio.bucketName,
      previewObjectName,
      previewContent,
      previewContent.length,
      { 'Content-Type': 'video/mp4' }
    );

    results.preview = previewObjectName;
    await fs.unlink(previewPath);

    await job.updateProgress(100);

    return results;
  } catch (error) {
    logger.error(`Transcoding job failed for video ${videoId}:`, error);
    throw error;
  }
}

export async function addTranscodingJob(data: TranscodingJobData): Promise<string> {
  const job = await transcodingQueue.add('transcode', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // 1 hour
      count: 100,
    },
    removeOnFail: {
      age: 86400, // 24 hours
    },
  });

  return job.id!;
}

export async function getJobStatus(jobId: string): Promise<any> {
  const job = await transcodingQueue.getJob(jobId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    returnValue: job.returnvalue,
    failedReason: job.failedReason,
    createdAt: new Date(job.timestamp),
    processedAt: job.processedOn ? new Date(job.processedOn) : null,
    finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
  };
}

export async function getQueueMetrics(): Promise<any> {
  const waiting = await transcodingQueue.getWaitingCount();
  const active = await transcodingQueue.getActiveCount();
  const completed = await transcodingQueue.getCompletedCount();
  const failed = await transcodingQueue.getFailedCount();

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active + completed + failed,
  };
}