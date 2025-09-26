import * as Minio from 'minio';
import { config } from './index';
import { logger } from '../utils/logger';

let storageClient: Minio.Client;

export async function initializeStorage(): Promise<void> {
  try {
    if (config.storage.type === 'minio') {
      storageClient = new Minio.Client({
        endPoint: config.storage.minio.endpoint,
        port: config.storage.minio.port,
        useSSL: config.storage.minio.useSSL,
        accessKey: config.storage.minio.accessKey,
        secretKey: config.storage.minio.secretKey,
      });

      // Ensure bucket exists
      const bucketName = config.storage.minio.bucketName;
      const exists = await storageClient.bucketExists(bucketName);

      if (!exists) {
        await storageClient.makeBucket(bucketName, 'us-east-1');
        logger.info(`Created bucket: ${bucketName}`);

        // Set bucket policy for public read access to streaming content
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/streams/*`],
            },
          ],
        };

        await storageClient.setBucketPolicy(bucketName, JSON.stringify(policy));
        logger.info(`Set public read policy for bucket: ${bucketName}`);
      }
    }
  } catch (error) {
    logger.error('Storage initialization failed:', error);
    throw error;
  }
}

export function getStorageClient(): Minio.Client {
  if (!storageClient) {
    throw new Error('Storage client not initialized');
  }
  return storageClient;
}

export async function uploadFile(
  bucketName: string,
  objectName: string,
  stream: NodeJS.ReadableStream | Buffer,
  size?: number,
  metadata?: Record<string, string>
): Promise<string> {
  try {
    await storageClient.putObject(bucketName, objectName, stream, size, metadata);
    return objectName;
  } catch (error) {
    logger.error('File upload failed:', error);
    throw error;
  }
}

export async function downloadFile(
  bucketName: string,
  objectName: string
): Promise<NodeJS.ReadableStream> {
  try {
    return await storageClient.getObject(bucketName, objectName);
  } catch (error) {
    logger.error('File download failed:', error);
    throw error;
  }
}

export async function deleteFile(
  bucketName: string,
  objectName: string
): Promise<void> {
  try {
    await storageClient.removeObject(bucketName, objectName);
  } catch (error) {
    logger.error('File deletion failed:', error);
    throw error;
  }
}

export async function getFileUrl(
  bucketName: string,
  objectName: string,
  expiry: number = 86400 // 24 hours
): Promise<string> {
  try {
    return await storageClient.presignedGetObject(bucketName, objectName, expiry);
  } catch (error) {
    logger.error('Failed to generate presigned URL:', error);
    throw error;
  }
}