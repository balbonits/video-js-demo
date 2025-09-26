import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { config, transcodingProfiles } from '../config';
import { logger } from '../utils/logger';
import { uploadFile, deleteFile } from '../config/storage';
import { getRedisClient } from '../config/redis';

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

export interface TranscodingJob {
  id: string;
  inputPath: string;
  outputPath: string;
  profile: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface VideoMetadata {
  duration: number;
  format: string;
  width: number;
  height: number;
  bitrate: number;
  fps: number;
  codec: string;
  audioCodec?: string;
  audioBitrate?: number;
}

export class TranscodingService {
  private tempDir = '/tmp/streaming';
  private redis = getRedisClient();

  constructor() {
    this.ensureTempDir();
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create temp directory:', error);
    }
  }

  async getVideoMetadata(inputPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        if (!videoStream) {
          return reject(new Error('No video stream found'));
        }

        resolve({
          duration: metadata.format.duration || 0,
          format: metadata.format.format_name || '',
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          bitrate: parseInt(metadata.format.bit_rate || '0'),
          fps: eval(videoStream.r_frame_rate || '0'),
          codec: videoStream.codec_name || '',
          audioCodec: audioStream?.codec_name,
          audioBitrate: audioStream ? parseInt(audioStream.bit_rate || '0') : undefined,
        });
      });
    });
  }

  async transcodeVideo(
    inputPath: string,
    profile: string,
    jobId: string
  ): Promise<string> {
    const profileConfig = transcodingProfiles[profile as keyof typeof transcodingProfiles];
    if (!profileConfig) {
      throw new Error(`Invalid transcoding profile: ${profile}`);
    }

    const outputFileName = `${uuidv4()}_${profile}.mp4`;
    const outputPath = path.join(this.tempDir, outputFileName);

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          `-b:v ${profileConfig.videoBitrate}`,
          `-maxrate ${profileConfig.maxRate}`,
          `-bufsize ${profileConfig.bufSize}`,
          '-c:a aac',
          `-b:a ${profileConfig.audioBitrate}`,
          '-movflags +faststart',
          `-threads ${config.transcoding.ffmpegThreads}`,
        ])
        .size(profileConfig.resolution)
        .format('mp4')
        .on('start', (commandLine) => {
          logger.info(`Starting transcoding: ${commandLine}`);
          this.updateJobStatus(jobId, 'processing', 0);
        })
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          logger.debug(`Transcoding progress: ${percent}%`);
          this.updateJobStatus(jobId, 'processing', percent);
        })
        .on('end', () => {
          logger.info(`Transcoding completed: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error(`Transcoding failed: ${err.message}`);
          this.updateJobStatus(jobId, 'failed', 0, err.message);
          reject(err);
        });

      command.save(outputPath);
    });
  }

  async generateHLS(
    inputPath: string,
    jobId: string
  ): Promise<{ playlistPath: string; segmentPaths: string[] }> {
    const outputDir = path.join(this.tempDir, `hls_${uuidv4()}`);
    await fs.mkdir(outputDir, { recursive: true });

    const playlistName = 'playlist.m3u8';
    const playlistPath = path.join(outputDir, playlistName);
    const segmentPattern = path.join(outputDir, 'segment_%03d.ts');

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v copy',
          '-c:a copy',
          '-f hls',
          `-hls_time ${config.streaming.hls.segmentDuration}`,
          `-hls_list_size ${config.streaming.hls.playlistSize}`,
          '-hls_flags delete_segments',
          '-hls_segment_type mpegts',
          '-hls_segment_filename', segmentPattern,
        ])
        .on('start', (commandLine) => {
          logger.info(`Starting HLS generation: ${commandLine}`);
          this.updateJobStatus(jobId, 'processing', 0);
        })
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          this.updateJobStatus(jobId, 'processing', percent);
        })
        .on('end', async () => {
          logger.info('HLS generation completed');
          const files = await fs.readdir(outputDir);
          const segmentPaths = files
            .filter(f => f.endsWith('.ts'))
            .map(f => path.join(outputDir, f));
          resolve({ playlistPath, segmentPaths });
        })
        .on('error', (err) => {
          logger.error(`HLS generation failed: ${err.message}`);
          this.updateJobStatus(jobId, 'failed', 0, err.message);
          reject(err);
        });

      command.save(playlistPath);
    });
  }

  async generateDASH(
    inputPath: string,
    jobId: string
  ): Promise<{ manifestPath: string; segmentPaths: string[] }> {
    const outputDir = path.join(this.tempDir, `dash_${uuidv4()}`);
    await fs.mkdir(outputDir, { recursive: true });

    const manifestName = 'manifest.mpd';
    const manifestPath = path.join(outputDir, manifestName);
    const segmentPattern = path.join(outputDir, 'segment_$Number$.m4s');

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          '-c:v copy',
          '-c:a copy',
          '-f dash',
          `-seg_duration ${config.streaming.dash.segmentDuration}`,
          '-use_timeline 1',
          '-use_template 1',
          '-init_seg_name init_$RepresentationID$.m4s',
          '-media_seg_name', segmentPattern,
        ])
        .on('start', (commandLine) => {
          logger.info(`Starting DASH generation: ${commandLine}`);
          this.updateJobStatus(jobId, 'processing', 0);
        })
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          this.updateJobStatus(jobId, 'processing', percent);
        })
        .on('end', async () => {
          logger.info('DASH generation completed');
          const files = await fs.readdir(outputDir);
          const segmentPaths = files
            .filter(f => f.endsWith('.m4s'))
            .map(f => path.join(outputDir, f));
          resolve({ manifestPath, segmentPaths });
        })
        .on('error', (err) => {
          logger.error(`DASH generation failed: ${err.message}`);
          this.updateJobStatus(jobId, 'failed', 0, err.message);
          reject(err);
        });

      command.save(manifestPath);
    });
  }

  async generateThumbnails(
    inputPath: string,
    count: number = 5
  ): Promise<string[]> {
    const metadata = await this.getVideoMetadata(inputPath);
    const duration = metadata.duration;
    const interval = duration / (count + 1);
    const thumbnails: string[] = [];

    for (let i = 1; i <= count; i++) {
      const timestamp = interval * i;
      const outputPath = path.join(this.tempDir, `thumb_${uuidv4()}.jpg`);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: [timestamp],
            filename: path.basename(outputPath),
            folder: path.dirname(outputPath),
            size: '320x180',
          })
          .on('end', () => {
            thumbnails.push(outputPath);
            resolve();
          })
          .on('error', reject);
      });
    }

    return thumbnails;
  }

  async generatePreviewVideo(
    inputPath: string,
    duration: number = 30
  ): Promise<string> {
    const outputPath = path.join(this.tempDir, `preview_${uuidv4()}.mp4`);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setDuration(duration)
        .outputOptions([
          '-c:v libx264',
          '-preset fast',
          '-crf 28',
          '-b:v 1000k',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
        ])
        .size('640x360')
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .save(outputPath);
    });
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    progress: number,
    error?: string
  ): Promise<void> {
    const job = {
      status,
      progress,
      error,
      updatedAt: new Date().toISOString(),
    };

    await this.redis.hset(`job:${jobId}`, job as any);
    await this.redis.expire(`job:${jobId}`, 86400); // 24 hours
  }

  async getJobStatus(jobId: string): Promise<TranscodingJob | null> {
    const job = await this.redis.hgetall(`job:${jobId}`);
    if (!job || Object.keys(job).length === 0) {
      return null;
    }

    return {
      id: jobId,
      ...job,
      progress: parseInt(job.progress || '0'),
      createdAt: new Date(job.createdAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
    } as TranscodingJob;
  }

  async cleanupTempFiles(paths: string[]): Promise<void> {
    for (const filePath of paths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.error(`Failed to delete temp file: ${filePath}`, error);
      }
    }
  }
}

export const transcodingService = new TranscodingService();