import jwt from 'jsonwebtoken';
import forge from 'node-forge';
import { getDatabase } from '../config/database';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface DRMToken {
  id: string;
  user_id: string;
  content_id: string;
  device_id?: string;
  expires_at: Date;
  restrictions: TokenRestrictions;
  fingerprint: string;
}

export interface TokenRestrictions {
  max_streams?: number;
  geo_regions?: string[];
  device_types?: string[];
  hdcp_required?: boolean;
  offline_playback?: boolean;
}

export interface ContentKey {
  key_id: string;
  key_value: string;
  provider: 'widevine' | 'fairplay' | 'playready';
  content_id: string;
}

export class DRMService {
  private db = getDatabase();
  private redis = getRedisClient();
  private privateKey: string;
  private publicKey: string;

  async initialize() {
    // Load or generate key pair
    await this.loadKeys();
    logger.info('DRM service initialized');
  }

  async generateToken(params: {
    user_id: string;
    content_id: string;
    duration?: number;
    restrictions?: TokenRestrictions;
    device_id?: string;
  }): Promise<{ token: string; expires_at: Date; license_url: string }> {
    try {
      const tokenId = uuidv4();
      const expiresAt = new Date(Date.now() + (params.duration || 21600) * 1000); // Default 6 hours
      const fingerprint = this.generateFingerprint(params.user_id, params.device_id);

      // Create JWT payload
      const payload = {
        jti: tokenId,
        sub: params.user_id,
        cid: params.content_id,
        did: params.device_id,
        exp: Math.floor(expiresAt.getTime() / 1000),
        iat: Math.floor(Date.now() / 1000),
        restrictions: params.restrictions || {},
        fingerprint,
      };

      // Sign token
      const token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
      });

      // Store token metadata
      await this.storeToken({
        id: tokenId,
        user_id: params.user_id,
        content_id: params.content_id,
        device_id: params.device_id,
        expires_at: expiresAt,
        restrictions: params.restrictions || {},
        fingerprint,
        token_hash: this.hashToken(token),
      });

      // Cache for quick validation
      await this.redis.setex(
        `drm:token:${tokenId}`,
        params.duration || 21600,
        JSON.stringify(payload)
      );

      return {
        token,
        expires_at: expiresAt,
        license_url: this.getLicenseUrl(),
      };
    } catch (error) {
      logger.error('Failed to generate DRM token:', error);
      throw error;
    }
  }

  async validateToken(token: string, contentId: string, deviceId?: string): Promise<boolean> {
    try {
      // Verify JWT signature
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
      }) as any;

      // Check if token is for the requested content
      if (decoded.cid !== contentId) {
        logger.warn('Token content mismatch');
        return false;
      }

      // Check device if specified
      if (deviceId && decoded.did && decoded.did !== deviceId) {
        logger.warn('Token device mismatch');
        return false;
      }

      // Check if token is revoked
      const isRevoked = await this.redis.get(`drm:revoked:${decoded.jti}`);
      if (isRevoked) {
        logger.warn('Token is revoked');
        return false;
      }

      // Check concurrent streams
      if (decoded.restrictions?.max_streams) {
        const activeStreams = await this.getActiveStreams(decoded.sub);
        if (activeStreams >= decoded.restrictions.max_streams) {
          logger.warn('Max concurrent streams exceeded');
          return false;
        }
      }

      // Validate fingerprint
      const expectedFingerprint = this.generateFingerprint(decoded.sub, deviceId);
      if (decoded.fingerprint !== expectedFingerprint) {
        logger.warn('Fingerprint mismatch - possible token sharing');
        // Log suspicious activity
        await this.logSuspiciousActivity(decoded.sub, contentId, 'fingerprint_mismatch');
      }

      return true;
    } catch (error) {
      logger.error('Token validation failed:', error);
      return false;
    }
  }

  async generateContentKey(contentId: string, provider: string): Promise<ContentKey> {
    try {
      const keyId = crypto.randomBytes(16).toString('hex');
      const keyValue = crypto.randomBytes(16).toString('hex');

      const contentKey: ContentKey = {
        key_id: keyId,
        key_value: keyValue,
        provider: provider as any,
        content_id: contentId,
      };

      // Store in database
      await this.db('content_keys').insert({
        ...contentKey,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 86400000 * 30), // 30 days
      });

      // Cache for quick access
      await this.redis.setex(
        `drm:key:${contentId}:${provider}`,
        86400, // 24 hours
        JSON.stringify(contentKey)
      );

      return contentKey;
    } catch (error) {
      logger.error('Failed to generate content key:', error);
      throw error;
    }
  }

  async getContentKey(contentId: string, provider: string): Promise<ContentKey | null> {
    try {
      // Check cache first
      const cached = await this.redis.get(`drm:key:${contentId}:${provider}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from database
      const key = await this.db('content_keys')
        .where({ content_id: contentId, provider })
        .andWhere('expires_at', '>', new Date())
        .first();

      if (key) {
        // Re-cache
        await this.redis.setex(
          `drm:key:${contentId}:${provider}`,
          86400,
          JSON.stringify(key)
        );
      }

      return key;
    } catch (error) {
      logger.error('Failed to get content key:', error);
      return null;
    }
  }

  async processLicenseRequest(
    provider: string,
    requestData: Buffer,
    token: string
  ): Promise<Buffer> {
    try {
      // Validate token first
      const decoded = jwt.verify(token, this.publicKey) as any;

      if (!decoded || !decoded.cid) {
        throw new Error('Invalid token');
      }

      // Get content key
      const contentKey = await this.getContentKey(decoded.cid, provider);
      if (!contentKey) {
        throw new Error('Content key not found');
      }

      // Process based on provider
      let licenseResponse: Buffer;

      switch (provider) {
        case 'widevine':
          licenseResponse = await this.processWidevineLicense(requestData, contentKey);
          break;
        case 'fairplay':
          licenseResponse = await this.processFairPlayLicense(requestData, contentKey);
          break;
        case 'playready':
          licenseResponse = await this.processPlayReadyLicense(requestData, contentKey);
          break;
        default:
          throw new Error('Unsupported DRM provider');
      }

      // Log license request
      await this.logLicenseRequest(decoded.sub, decoded.cid, provider);

      return licenseResponse;
    } catch (error) {
      logger.error('Failed to process license request:', error);
      throw error;
    }
  }

  private async processWidevineLicense(requestData: Buffer, contentKey: ContentKey): Promise<Buffer> {
    // Simplified Widevine license response
    // In production, integrate with Widevine license server
    const response = {
      status: 'OK',
      license: Buffer.from(contentKey.key_value, 'hex').toString('base64'),
      key_id: contentKey.key_id,
    };

    return Buffer.from(JSON.stringify(response));
  }

  private async processFairPlayLicense(requestData: Buffer, contentKey: ContentKey): Promise<Buffer> {
    // Simplified FairPlay license response
    // In production, integrate with Apple FairPlay server
    const response = {
      ck: Buffer.from(contentKey.key_value, 'hex').toString('base64'),
    };

    return Buffer.from(JSON.stringify(response));
  }

  private async processPlayReadyLicense(requestData: Buffer, contentKey: ContentKey): Promise<Buffer> {
    // Simplified PlayReady license response
    // In production, integrate with Microsoft PlayReady server
    const response = {
      license: Buffer.from(contentKey.key_value, 'hex').toString('base64'),
    };

    return Buffer.from(JSON.stringify(response));
  }

  private async loadKeys() {
    // In production, load from secure storage
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
    this.privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
    this.publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
  }

  private generateFingerprint(userId: string, deviceId?: string): string {
    const data = `${userId}:${deviceId || 'unknown'}:${process.env.JWT_SECRET}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getLicenseUrl(): string {
    return `${process.env.API_BASE_URL || 'http://localhost:3005'}/api/license`;
  }

  private async storeToken(data: any) {
    await this.db('access_tokens').insert({
      ...data,
      created_at: new Date(),
    });
  }

  private async getActiveStreams(userId: string): Promise<number> {
    const count = await this.redis.get(`drm:streams:${userId}`);
    return parseInt(count || '0');
  }

  private async logLicenseRequest(userId: string, contentId: string, provider: string) {
    await this.db('license_requests').insert({
      id: uuidv4(),
      user_id: userId,
      content_id: contentId,
      provider,
      created_at: new Date(),
    });
  }

  private async logSuspiciousActivity(userId: string, contentId: string, reason: string) {
    logger.warn(`Suspicious activity: ${reason} for user ${userId} on content ${contentId}`);
    await this.db('suspicious_activities').insert({
      id: uuidv4(),
      user_id: userId,
      content_id: contentId,
      reason,
      created_at: new Date(),
    });
  }
}