# Streaming Pipeline Architecture

## Overview

This document details the comprehensive streaming pipeline architecture for our video player, covering HLS/DASH implementation, CDN integration, adaptive bitrate streaming, buffer management, network resilience, and caching strategies.

## Table of Contents

1. [Streaming Architecture Overview](#streaming-architecture-overview)
2. [HLS Implementation](#hls-implementation)
3. [DASH Implementation](#dash-implementation)
4. [CDN Integration Architecture](#cdn-integration-architecture)
5. [Adaptive Bitrate Algorithm](#adaptive-bitrate-algorithm)
6. [Buffer Management Strategy](#buffer-management-strategy)
7. [Network Resilience Patterns](#network-resilience-patterns)
8. [Fallback Mechanisms](#fallback-mechanisms)
9. [Cache Strategies](#cache-strategies)
10. [Performance Optimization](#performance-optimization)

## Streaming Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Video.js Player │ HLS/DASH Parser │ ABR Engine │ Buffer    │
├─────────────────────────────────────────────────────────────┤
│                      Network Layer                           │
├─────────────────────────────────────────────────────────────┤
│  HTTP/2 │ WebRTC │ Service Worker │ Cache API               │
├─────────────────────────────────────────────────────────────┤
│                        CDN Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Edge Servers │ Origin Shield │ Multi-CDN │ GeoDNS          │
├─────────────────────────────────────────────────────────────┤
│                      Origin Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Video Storage │ Transcoding │ Packaging │ DRM              │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

```typescript
// src/streaming/StreamingPipeline.ts
export interface StreamingConfig {
  protocol: 'hls' | 'dash' | 'progressive';
  cdnUrl: string;
  backupCdnUrl?: string;
  adaptiveBitrate: boolean;
  bufferTarget: number; // seconds
  maxBufferLength: number; // seconds
  retryAttempts: number;
  retryDelay: number; // milliseconds
  cachingStrategy: 'aggressive' | 'moderate' | 'minimal';
}

export class StreamingPipeline {
  private config: StreamingConfig;
  private player: videojs.Player;
  private abrEngine: AdaptiveBitrateEngine;
  private bufferManager: BufferManager;
  private networkMonitor: NetworkMonitor;
  private cacheManager: CacheManager;

  constructor(player: videojs.Player, config: StreamingConfig) {
    this.player = player;
    this.config = config;
    this.initialize();
  }

  private initialize() {
    this.setupProtocol();
    this.initializeABR();
    this.setupBufferManagement();
    this.configureNetworkResilience();
    this.setupCaching();
  }

  private setupProtocol() {
    switch (this.config.protocol) {
      case 'hls':
        this.setupHLS();
        break;
      case 'dash':
        this.setupDASH();
        break;
      case 'progressive':
        this.setupProgressive();
        break;
    }
  }
}
```

## HLS Implementation

### HLS Architecture

```typescript
// src/streaming/HLSManager.ts
import Hls from 'hls.js';

export class HLSManager {
  private hls: Hls | null = null;
  private videoElement: HTMLVideoElement;
  private config: Partial<Hls.Config>;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.config = this.getOptimalConfig();
  }

  private getOptimalConfig(): Partial<Hls.Config> {
    return {
      // Basic configuration
      debug: process.env.NODE_ENV === 'development',
      enableWorker: true,
      lowLatencyMode: false,

      // Network configuration
      maxLoadingDelay: 4,
      minAutoBitrate: 500000,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      maxBufferSize: 60 * 1000 * 1000, // 60 MB
      maxBufferHole: 0.5,

      // ABR configuration
      abrEwmaFastLive: 3.0,
      abrEwmaSlowLive: 9.0,
      abrEwmaFastVoD: 3.0,
      abrEwmaSlowVoD: 9.0,
      abrEwmaDefaultEstimate: 1000000, // 1 Mbps
      abrBandWidthFactor: 0.95,
      abrBandWidthUpFactor: 0.7,
      abrMaxWithRealBitrate: true,

      // Fragment loading
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 1000,
      fragLoadingMaxRetryTimeout: 64000,

      // Manifest loading
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: 3,
      manifestLoadingRetryDelay: 1000,
      manifestLoadingMaxRetryTimeout: 64000,

      // Level loading
      levelLoadingTimeOut: 10000,
      levelLoadingMaxRetry: 4,
      levelLoadingRetryDelay: 1000,
      levelLoadingMaxRetryTimeout: 64000,

      // Start level selection
      startLevel: -1, // Auto
      startFragPrefetch: true,

      // Error recovery
      errorReloadInterval: 3000,
      nudgeMaxRetry: 3,
      nudgeOffset: 0.1,
      maxFragLookUpTolerance: 0.25,
    };
  }

  public load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (Hls.isSupported()) {
        this.hls = new Hls(this.config);

        // Event listeners
        this.setupEventListeners(resolve, reject);

        // Load source
        this.hls.loadSource(url);
        this.hls.attachMedia(this.videoElement);
      } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        this.videoElement.src = url;
        this.videoElement.addEventListener('loadedmetadata', () => resolve());
        this.videoElement.addEventListener('error', () => reject(new Error('Native HLS playback failed')));
      } else {
        reject(new Error('HLS is not supported'));
      }
    });
  }

  private setupEventListeners(resolve: () => void, reject: (error: Error) => void) {
    if (!this.hls) return;

    this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      console.log(`Manifest loaded, found ${data.levels.length} quality levels`);
      resolve();
    });

    this.hls.on(Hls.Events.ERROR, (event, data) => {
      this.handleError(data, reject);
    });

    this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      console.log(`Switched to level ${data.level}`);
    });

    this.hls.on(Hls.Events.FRAG_BUFFERED, (event, data) => {
      this.updateBufferMetrics(data);
    });

    this.hls.on(Hls.Events.FPS_DROP, (event, data) => {
      console.warn(`FPS drop detected: ${data.currentDropped} frames dropped`);
    });
  }

  private handleError(data: Hls.ErrorData, reject: (error: Error) => void) {
    const { type, details, fatal } = data;

    if (fatal) {
      switch (type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          console.error('Fatal network error encountered, trying to recover');
          this.hls?.startLoad();
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          console.error('Fatal media error encountered, trying to recover');
          this.hls?.recoverMediaError();
          break;
        default:
          console.error('Fatal error, cannot recover');
          this.destroy();
          reject(new Error(`Fatal HLS error: ${details}`));
      }
    } else {
      console.warn(`Non-fatal HLS error: ${details}`);
    }
  }

  private updateBufferMetrics(data: any) {
    // Track buffer health metrics
    const bufferLength = this.getBufferLength();
    const metrics = {
      bufferLength,
      fragmentDuration: data.frag.duration,
      level: data.frag.level,
      timestamp: Date.now(),
    };

    // Send to analytics
    this.reportMetrics(metrics);
  }

  public getBufferLength(): number {
    const buffered = this.videoElement.buffered;
    const currentTime = this.videoElement.currentTime;

    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime < buffered.end(i)) {
        return buffered.end(i) - currentTime;
      }
    }

    return 0;
  }

  public setQualityLevel(level: number) {
    if (this.hls) {
      this.hls.currentLevel = level;
    }
  }

  public getQualityLevels(): Array<{ height: number; bitrate: number }> {
    if (this.hls) {
      return this.hls.levels.map(level => ({
        height: level.height,
        bitrate: level.bitrate,
      }));
    }
    return [];
  }

  public destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  private reportMetrics(metrics: any) {
    // Implementation for metrics reporting
    if (window.analytics) {
      window.analytics.track('buffer_metrics', metrics);
    }
  }
}
```

### HLS Manifest Generation

```typescript
// src/streaming/HLSManifestGenerator.ts
export class HLSManifestGenerator {
  private baseUrl: string;
  private variants: VideoVariant[];

  constructor(baseUrl: string, variants: VideoVariant[]) {
    this.baseUrl = baseUrl;
    this.variants = variants;
  }

  generateMasterPlaylist(): string {
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:6\n\n';

    // Add video variants
    this.variants.forEach(variant => {
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},`;
      playlist += `RESOLUTION=${variant.width}x${variant.height},`;
      playlist += `CODECS="${variant.codecs}",`;
      playlist += `FRAME-RATE=${variant.frameRate}\n`;
      playlist += `${variant.url}\n\n`;
    });

    // Add subtitles if available
    playlist += '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",';
    playlist += 'NAME="English",LANGUAGE="en",DEFAULT=YES,';
    playlist += 'AUTOSELECT=YES,FORCED=NO,';
    playlist += `URI="${this.baseUrl}/subtitles/en.m3u8"\n`;

    return playlist;
  }

  generateMediaPlaylist(segments: Segment[], targetDuration: number): string {
    let playlist = '#EXTM3U\n';
    playlist += '#EXT-X-VERSION:6\n';
    playlist += `#EXT-X-TARGETDURATION:${targetDuration}\n`;
    playlist += '#EXT-X-PLAYLIST-TYPE:VOD\n';
    playlist += '#EXT-X-MEDIA-SEQUENCE:0\n\n';

    segments.forEach(segment => {
      playlist += `#EXTINF:${segment.duration.toFixed(6)},\n`;
      if (segment.byteRange) {
        playlist += `#EXT-X-BYTERANGE:${segment.byteRange.length}@${segment.byteRange.offset}\n`;
      }
      playlist += `${segment.url}\n`;
    });

    playlist += '#EXT-X-ENDLIST\n';
    return playlist;
  }
}

interface VideoVariant {
  bandwidth: number;
  width: number;
  height: number;
  codecs: string;
  frameRate: number;
  url: string;
}

interface Segment {
  duration: number;
  url: string;
  byteRange?: {
    length: number;
    offset: number;
  };
}
```

## DASH Implementation

### DASH Manager

```typescript
// src/streaming/DASHManager.ts
import dashjs from 'dashjs';

export class DASHManager {
  private player: dashjs.MediaPlayerClass;
  private videoElement: HTMLVideoElement;
  private config: dashjs.MediaPlayerSettingClass;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.player = dashjs.MediaPlayer().create();
    this.config = this.getOptimalConfig();
  }

  private getOptimalConfig(): dashjs.MediaPlayerSettingClass {
    return {
      streaming: {
        abr: {
          autoSwitchBitrate: {
            video: true,
            audio: true,
          },
          limitBitrateByPortal: true,
          usePixelRatioInLimitBitrateByPortal: true,
          maxBitrate: {
            video: -1,
            audio: -1,
          },
          minBitrate: {
            video: -1,
            audio: -1,
          },
          initialBitrate: {
            video: 1000000,
            audio: 64000,
          },
        },
        buffer: {
          bufferTimeDefault: 12,
          bufferTimeAtTopQuality: 30,
          bufferTimeAtTopQualityLongForm: 60,
          longFormContentDurationThreshold: 600,
          initialBufferLevel: 4,
          stableBufferTime: 12,
          fastSwitchEnabled: true,
        },
        retryAttempts: {
          MPD: 3,
          XLinkExpansion: 1,
          MediaSegment: 3,
          InitializationSegment: 3,
          BitstreamSwitchingSegment: 3,
          IndexSegment: 3,
          FragmentInfoSegment: 3,
        },
        retryIntervals: {
          MPD: 1000,
          XLinkExpansion: 500,
          MediaSegment: 1000,
          InitializationSegment: 1000,
          BitstreamSwitchingSegment: 1000,
          IndexSegment: 1000,
          FragmentInfoSegment: 1000,
        },
        capabilities: {
          filterUnsupportedEssentialProperties: true,
          useMediaCapabilitiesApi: true,
        },
        protection: {
          detectPlayreadyMessageFormat: true,
        },
      },
    };
  }

  public load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.player.updateSettings(this.config);
      this.setupEventListeners(resolve, reject);
      this.player.initialize(this.videoElement, url, false);
    });
  }

  private setupEventListeners(resolve: () => void, reject: (error: Error) => void) {
    this.player.on(dashjs.MediaPlayer.events.MANIFEST_LOADED, (e) => {
      console.log('DASH manifest loaded');
      resolve();
    });

    this.player.on(dashjs.MediaPlayer.events.ERROR, (e) => {
      this.handleError(e, reject);
    });

    this.player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e) => {
      console.log(`Quality changed to ${e.newQuality} for ${e.mediaType}`);
    });

    this.player.on(dashjs.MediaPlayer.events.BUFFER_LEVEL_STATE_CHANGED, (e) => {
      console.log(`Buffer state: ${e.state}, level: ${e.level}`);
    });

    this.player.on(dashjs.MediaPlayer.events.PLAYBACK_RATE_CHANGED, (e) => {
      console.log(`Playback rate changed to ${e.playbackRate}`);
    });

    this.player.on(dashjs.MediaPlayer.events.METRIC_ADDED, (e) => {
      if (e.metric === 'BufferLevel') {
        this.trackBufferMetrics(e.value);
      }
    });
  }

  private handleError(error: any, reject: (error: Error) => void) {
    console.error('DASH error:', error);

    switch (error.error) {
      case 'download':
        // Network error - try to recover
        this.player.retrieveManifest(this.player.getSource());
        break;
      case 'manifestError':
        reject(new Error('Failed to load DASH manifest'));
        break;
      case 'mediasource':
        reject(new Error('MediaSource error'));
        break;
      default:
        console.warn('Non-critical DASH error:', error);
    }
  }

  private trackBufferMetrics(bufferLevel: any) {
    const metrics = {
      level: bufferLevel.level,
      mediaType: bufferLevel.mediaType,
      timestamp: Date.now(),
    };

    // Send to analytics
    if (window.analytics) {
      window.analytics.track('dash_buffer_metrics', metrics);
    }
  }

  public setQualityFor(mediaType: 'video' | 'audio', qualityIndex: number) {
    this.player.setQualityFor(mediaType, qualityIndex);
  }

  public getQualityFor(mediaType: 'video' | 'audio'): number {
    return this.player.getQualityFor(mediaType);
  }

  public getBitrateInfoListFor(mediaType: 'video' | 'audio'): any[] {
    return this.player.getBitrateInfoListFor(mediaType);
  }

  public destroy() {
    if (this.player) {
      this.player.destroy();
    }
  }
}
```

### DASH MPD Generation

```typescript
// src/streaming/DASHManifestGenerator.ts
export class DASHManifestGenerator {
  private baseUrl: string;
  private duration: number;

  constructor(baseUrl: string, duration: number) {
    this.baseUrl = baseUrl;
    this.duration = duration;
  }

  generateMPD(representations: DASHRepresentation[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 DASH-MPD.xsd"
     type="static"
     mediaPresentationDuration="PT${this.duration}S"
     minBufferTime="PT2S"
     profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">

  <Period duration="PT${this.duration}S">
    <AdaptationSet mimeType="video/mp4" codecs="avc1.42c01e" subsegmentAlignment="true">
      ${representations.map(rep => this.generateRepresentation(rep)).join('\n      ')}
    </AdaptationSet>

    <AdaptationSet mimeType="audio/mp4" codecs="mp4a.40.2" lang="en">
      <Representation id="audio" bandwidth="128000">
        <BaseURL>${this.baseUrl}/audio.mp4</BaseURL>
        <SegmentBase indexRange="0-863">
          <Initialization range="0-863"/>
        </SegmentBase>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;
  }

  private generateRepresentation(rep: DASHRepresentation): string {
    return `<Representation id="${rep.id}"
                     bandwidth="${rep.bandwidth}"
                     width="${rep.width}"
                     height="${rep.height}"
                     frameRate="${rep.frameRate}">
        <BaseURL>${this.baseUrl}/${rep.filename}</BaseURL>
        <SegmentBase indexRange="${rep.indexRange}">
          <Initialization range="${rep.initRange}"/>
        </SegmentBase>
      </Representation>`;
  }
}

interface DASHRepresentation {
  id: string;
  bandwidth: number;
  width: number;
  height: number;
  frameRate: number;
  filename: string;
  indexRange: string;
  initRange: string;
}
```

## CDN Integration Architecture

### Multi-CDN Strategy

```typescript
// src/streaming/CDNManager.ts
export class CDNManager {
  private primaryCDN: CDNProvider;
  private fallbackCDNs: CDNProvider[];
  private currentCDN: CDNProvider;
  private performanceMonitor: PerformanceMonitor;
  private geoLocationService: GeoLocationService;

  constructor(config: CDNConfig) {
    this.primaryCDN = new CDNProvider(config.primary);
    this.fallbackCDNs = config.fallbacks.map(f => new CDNProvider(f));
    this.currentCDN = this.primaryCDN;
    this.performanceMonitor = new PerformanceMonitor();
    this.geoLocationService = new GeoLocationService();
  }

  async selectOptimalCDN(): Promise<CDNProvider> {
    const userLocation = await this.geoLocationService.getUserLocation();
    const cdnScores = await this.evaluateCDNs(userLocation);

    // Select CDN with best score
    const optimalCDN = cdnScores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    this.currentCDN = optimalCDN.cdn;
    return this.currentCDN;
  }

  private async evaluateCDNs(userLocation: GeoLocation): Promise<CDNScore[]> {
    const evaluations = await Promise.all([
      this.evaluateCDN(this.primaryCDN, userLocation),
      ...this.fallbackCDNs.map(cdn => this.evaluateCDN(cdn, userLocation))
    ]);

    return evaluations;
  }

  private async evaluateCDN(cdn: CDNProvider, userLocation: GeoLocation): Promise<CDNScore> {
    const latency = await this.measureLatency(cdn);
    const throughput = await this.measureThroughput(cdn);
    const availability = await cdn.checkAvailability();
    const distance = this.calculateDistance(cdn.getEdgeLocation(), userLocation);

    // Calculate composite score
    const score = this.calculateScore({
      latency: latency,
      throughput: throughput,
      availability: availability,
      distance: distance,
      cost: cdn.getCostPerGB(),
    });

    return { cdn, score, metrics: { latency, throughput, availability, distance } };
  }

  private calculateScore(metrics: CDNMetrics): number {
    const weights = {
      latency: 0.3,
      throughput: 0.3,
      availability: 0.2,
      distance: 0.1,
      cost: 0.1,
    };

    // Normalize and weight metrics
    const normalizedLatency = 1 / (1 + metrics.latency / 100); // Lower is better
    const normalizedThroughput = Math.min(metrics.throughput / 100, 1); // Higher is better
    const normalizedAvailability = metrics.availability / 100;
    const normalizedDistance = 1 / (1 + metrics.distance / 1000); // Lower is better
    const normalizedCost = 1 / (1 + metrics.cost); // Lower is better

    return (
      normalizedLatency * weights.latency +
      normalizedThroughput * weights.throughput +
      normalizedAvailability * weights.availability +
      normalizedDistance * weights.distance +
      normalizedCost * weights.cost
    );
  }

  private async measureLatency(cdn: CDNProvider): Promise<number> {
    const testUrl = cdn.getTestUrl();
    const start = performance.now();

    try {
      await fetch(testUrl, { method: 'HEAD', cache: 'no-store' });
      return performance.now() - start;
    } catch {
      return Infinity;
    }
  }

  private async measureThroughput(cdn: CDNProvider): Promise<number> {
    const testUrl = cdn.getThroughputTestUrl();
    const testSize = 1024 * 1024; // 1MB test file

    const start = performance.now();
    try {
      const response = await fetch(testUrl, { cache: 'no-store' });
      const data = await response.arrayBuffer();
      const duration = (performance.now() - start) / 1000; // Convert to seconds
      const throughput = (data.byteLength * 8) / duration / 1000000; // Mbps

      return throughput;
    } catch {
      return 0;
    }
  }

  private calculateDistance(edgeLocation: GeoLocation, userLocation: GeoLocation): number {
    // Haversine formula for great-circle distance
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(userLocation.lat - edgeLocation.lat);
    const dLon = this.toRad(userLocation.lon - edgeLocation.lon);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(edgeLocation.lat)) *
      Math.cos(this.toRad(userLocation.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  public async handleCDNFailure(failedCDN: CDNProvider): Promise<CDNProvider> {
    console.error(`CDN failure detected: ${failedCDN.getName()}`);

    // Mark CDN as unhealthy
    failedCDN.setHealthy(false);

    // Select next best CDN
    const availableCDNs = [this.primaryCDN, ...this.fallbackCDNs]
      .filter(cdn => cdn.isHealthy() && cdn !== failedCDN);

    if (availableCDNs.length === 0) {
      throw new Error('All CDNs are unavailable');
    }

    // Evaluate remaining CDNs
    const userLocation = await this.geoLocationService.getUserLocation();
    const scores = await Promise.all(
      availableCDNs.map(cdn => this.evaluateCDN(cdn, userLocation))
    );

    const bestCDN = scores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    this.currentCDN = bestCDN.cdn;
    console.log(`Switched to CDN: ${this.currentCDN.getName()}`);

    return this.currentCDN;
  }

  public getVideoUrl(path: string): string {
    return this.currentCDN.constructUrl(path);
  }
}

interface CDNConfig {
  primary: CDNProviderConfig;
  fallbacks: CDNProviderConfig[];
}

interface CDNProviderConfig {
  name: string;
  baseUrl: string;
  edgeLocations: GeoLocation[];
  costPerGB: number;
}

interface GeoLocation {
  lat: number;
  lon: number;
}

interface CDNMetrics {
  latency: number;
  throughput: number;
  availability: number;
  distance: number;
  cost: number;
}

interface CDNScore {
  cdn: CDNProvider;
  score: number;
  metrics: Partial<CDNMetrics>;
}
```

## Adaptive Bitrate Algorithm

### ABR Engine Implementation

```typescript
// src/streaming/AdaptiveBitrateEngine.ts
export class AdaptiveBitrateEngine {
  private bandwidthEstimator: BandwidthEstimator;
  private bufferMonitor: BufferMonitor;
  private qualityController: QualityController;
  private currentLevel: number = -1;
  private levels: QualityLevel[];
  private config: ABRConfig;

  constructor(config: ABRConfig) {
    this.config = config;
    this.bandwidthEstimator = new BandwidthEstimator();
    this.bufferMonitor = new BufferMonitor();
    this.qualityController = new QualityController();
    this.levels = [];
  }

  public selectOptimalLevel(): number {
    const bandwidth = this.bandwidthEstimator.getEstimate();
    const bufferHealth = this.bufferMonitor.getHealth();
    const currentLevel = this.currentLevel;

    // Get candidate levels based on bandwidth
    const candidateLevels = this.getCandidateLevels(bandwidth);

    // Apply buffer-based constraints
    const constrainedLevels = this.applyBufferConstraints(
      candidateLevels,
      bufferHealth
    );

    // Apply stability rules
    const stableLevel = this.applyStabilityRules(
      constrainedLevels,
      currentLevel,
      bufferHealth
    );

    // Apply quality limits
    const finalLevel = this.applyQualityLimits(stableLevel);

    this.currentLevel = finalLevel;
    return finalLevel;
  }

  private getCandidateLevels(bandwidth: number): number[] {
    const safeBandwidth = bandwidth * this.config.bandwidthSafetyFactor;

    return this.levels
      .map((level, index) => ({ level, index }))
      .filter(({ level }) => level.bitrate <= safeBandwidth)
      .map(({ index }) => index);
  }

  private applyBufferConstraints(
    candidateLevels: number[],
    bufferHealth: BufferHealth
  ): number[] {
    if (bufferHealth.level < this.config.panicBufferLevel) {
      // Panic mode: switch to lowest quality
      return [0];
    }

    if (bufferHealth.level < this.config.minBufferLevel) {
      // Low buffer: limit to lower qualities
      const maxAllowedBitrate = this.levels[this.currentLevel].bitrate * 0.7;
      return candidateLevels.filter(
        index => this.levels[index].bitrate <= maxAllowedBitrate
      );
    }

    if (bufferHealth.level > this.config.maxBufferLevel) {
      // High buffer: allow quality increases
      return candidateLevels;
    }

    // Normal buffer: maintain current quality if possible
    if (candidateLevels.includes(this.currentLevel)) {
      return [this.currentLevel, ...candidateLevels];
    }

    return candidateLevels;
  }

  private applyStabilityRules(
    candidateLevels: number[],
    currentLevel: number,
    bufferHealth: BufferHealth
  ): number {
    if (candidateLevels.length === 0) {
      return 0; // Fallback to lowest quality
    }

    // Prevent frequent quality switches
    const timeSinceLastSwitch = Date.now() - this.qualityController.getLastSwitchTime();

    if (timeSinceLastSwitch < this.config.minTimeBetweenSwitches) {
      // Too soon to switch, stay at current level if possible
      if (candidateLevels.includes(currentLevel)) {
        return currentLevel;
      }
    }

    // Prefer gradual changes
    const desiredLevel = candidateLevels[candidateLevels.length - 1];

    if (Math.abs(desiredLevel - currentLevel) > this.config.maxLevelJump) {
      // Large jump detected, make gradual change
      if (desiredLevel > currentLevel) {
        return Math.min(currentLevel + this.config.maxLevelJump, desiredLevel);
      } else {
        return Math.max(currentLevel - this.config.maxLevelJump, desiredLevel);
      }
    }

    return desiredLevel;
  }

  private applyQualityLimits(level: number): number {
    // Apply user preferences
    if (this.config.maxQuality !== -1) {
      level = Math.min(level, this.config.maxQuality);
    }

    if (this.config.minQuality !== -1) {
      level = Math.max(level, this.config.minQuality);
    }

    // Apply device constraints
    const deviceConstraints = this.getDeviceConstraints();
    if (deviceConstraints.maxResolution) {
      const maxLevelForDevice = this.levels.findIndex(
        l => l.height > deviceConstraints.maxResolution
      );
      if (maxLevelForDevice !== -1) {
        level = Math.min(level, maxLevelForDevice - 1);
      }
    }

    return level;
  }

  private getDeviceConstraints(): DeviceConstraints {
    const screenWidth = window.screen.width * window.devicePixelRatio;
    const screenHeight = window.screen.height * window.devicePixelRatio;
    const maxResolution = Math.min(screenWidth, screenHeight);

    // Check for battery saver mode
    const batteryStatus = (navigator as any).getBattery?.();
    const isLowPower = batteryStatus?.level < 0.2;

    // Check connection type
    const connection = (navigator as any).connection;
    const isMetered = connection?.effectiveType === '3g' ||
                      connection?.effectiveType === '2g';

    return {
      maxResolution: isLowPower ? 720 : maxResolution,
      isMetered,
      isLowPower,
    };
  }

  public updateLevels(levels: QualityLevel[]) {
    this.levels = levels.sort((a, b) => a.bitrate - b.bitrate);
  }

  public forceLevel(level: number) {
    this.currentLevel = level;
    this.qualityController.recordSwitch(level);
  }
}

// Bandwidth Estimator using EWMA
class BandwidthEstimator {
  private samples: BandwidthSample[] = [];
  private ewmaFast: number = 0;
  private ewmaSlow: number = 0;
  private defaultEstimate: number = 1000000; // 1 Mbps

  public addSample(bytes: number, duration: number) {
    const bandwidth = (bytes * 8) / duration; // bits per second

    const sample: BandwidthSample = {
      bandwidth,
      timestamp: Date.now(),
    };

    this.samples.push(sample);

    // Keep only recent samples (last 30 seconds)
    const cutoff = Date.now() - 30000;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);

    // Update EWMA
    this.updateEWMA(bandwidth);
  }

  private updateEWMA(bandwidth: number) {
    const fastAlpha = 0.9;
    const slowAlpha = 0.95;

    if (this.ewmaFast === 0) {
      this.ewmaFast = bandwidth;
      this.ewmaSlow = bandwidth;
    } else {
      this.ewmaFast = fastAlpha * this.ewmaFast + (1 - fastAlpha) * bandwidth;
      this.ewmaSlow = slowAlpha * this.ewmaSlow + (1 - slowAlpha) * bandwidth;
    }
  }

  public getEstimate(): number {
    if (this.samples.length === 0) {
      return this.defaultEstimate;
    }

    // Use the minimum of fast and slow EWMA for conservative estimate
    return Math.min(this.ewmaFast, this.ewmaSlow);
  }
}

interface ABRConfig {
  bandwidthSafetyFactor: number;
  minBufferLevel: number;
  maxBufferLevel: number;
  panicBufferLevel: number;
  minTimeBetweenSwitches: number;
  maxLevelJump: number;
  maxQuality: number;
  minQuality: number;
}

interface QualityLevel {
  bitrate: number;
  width: number;
  height: number;
  frameRate: number;
  codec: string;
}

interface BufferHealth {
  level: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  stalls: number;
}

interface BandwidthSample {
  bandwidth: number;
  timestamp: number;
}

interface DeviceConstraints {
  maxResolution: number;
  isMetered: boolean;
  isLowPower: boolean;
}
```

## Buffer Management Strategy

### Advanced Buffer Manager

```typescript
// src/streaming/BufferManager.ts
export class BufferManager {
  private videoElement: HTMLVideoElement;
  private config: BufferConfig;
  private bufferWatcher: BufferWatcher;
  private stallDetector: StallDetector;
  private preloadManager: PreloadManager;

  constructor(videoElement: HTMLVideoElement, config: BufferConfig) {
    this.videoElement = videoElement;
    this.config = config;
    this.bufferWatcher = new BufferWatcher(videoElement);
    this.stallDetector = new StallDetector(videoElement);
    this.preloadManager = new PreloadManager();

    this.initialize();
  }

  private initialize() {
    this.startBufferMonitoring();
    this.setupStallDetection();
    this.configurePreloading();
  }

  private startBufferMonitoring() {
    setInterval(() => {
      const bufferInfo = this.getBufferInfo();
      this.adjustBufferStrategy(bufferInfo);
      this.reportBufferMetrics(bufferInfo);
    }, 1000);
  }

  public getBufferInfo(): BufferInfo {
    const buffered = this.videoElement.buffered;
    const currentTime = this.videoElement.currentTime;

    let bufferLength = 0;
    let bufferStart = 0;
    let bufferEnd = 0;
    let bufferHoles: BufferHole[] = [];

    // Find current buffer range
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
        bufferStart = buffered.start(i);
        bufferEnd = buffered.end(i);
        bufferLength = bufferEnd - currentTime;
        break;
      }
    }

    // Detect buffer holes
    for (let i = 0; i < buffered.length - 1; i++) {
      const holeStart = buffered.end(i);
      const holeEnd = buffered.start(i + 1);

      if (holeEnd - holeStart > 0.1) { // Hole threshold
        bufferHoles.push({
          start: holeStart,
          end: holeEnd,
          duration: holeEnd - holeStart,
        });
      }
    }

    return {
      length: bufferLength,
      start: bufferStart,
      end: bufferEnd,
      holes: bufferHoles,
      percentage: this.calculateBufferPercentage(),
      health: this.assessBufferHealth(bufferLength, bufferHoles),
    };
  }

  private calculateBufferPercentage(): number {
    const buffered = this.videoElement.buffered;
    const duration = this.videoElement.duration;

    if (!duration || buffered.length === 0) {
      return 0;
    }

    let bufferedTime = 0;
    for (let i = 0; i < buffered.length; i++) {
      bufferedTime += buffered.end(i) - buffered.start(i);
    }

    return (bufferedTime / duration) * 100;
  }

  private assessBufferHealth(bufferLength: number, holes: BufferHole[]): BufferHealthStatus {
    if (bufferLength < this.config.criticalBufferLevel) {
      return 'critical';
    }

    if (bufferLength < this.config.minBufferLevel) {
      return 'low';
    }

    if (holes.length > this.config.maxBufferHoles) {
      return 'fragmented';
    }

    if (bufferLength > this.config.optimalBufferLevel) {
      return 'excellent';
    }

    return 'good';
  }

  private adjustBufferStrategy(bufferInfo: BufferInfo) {
    switch (bufferInfo.health) {
      case 'critical':
        this.enterPanicMode();
        break;
      case 'low':
        this.increaseBuffering();
        break;
      case 'fragmented':
        this.defragmentBuffer();
        break;
      case 'excellent':
        this.optimizeBuffering();
        break;
    }
  }

  private enterPanicMode() {
    console.warn('Buffer critical - entering panic mode');

    // Pause playback if necessary
    if (this.config.pauseOnCriticalBuffer && !this.videoElement.paused) {
      this.videoElement.pause();
    }

    // Request lowest quality
    this.emit('requestLowestQuality');

    // Aggressive pre-buffering
    this.preloadManager.setAggressiveMode(true);
  }

  private increaseBuffering() {
    // Increase buffer target
    const newTarget = Math.min(
      this.config.maxBufferLength,
      this.config.targetBufferLength * 1.5
    );

    this.emit('adjustBufferTarget', newTarget);
  }

  private defragmentBuffer() {
    // Seek to nearest complete buffer range
    const buffered = this.videoElement.buffered;
    const currentTime = this.videoElement.currentTime;

    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) > currentTime) {
        console.log(`Jumping buffer hole to ${buffered.start(i)}`);
        this.videoElement.currentTime = buffered.start(i);
        break;
      }
    }
  }

  private optimizeBuffering() {
    // Reduce buffer target to save bandwidth
    const newTarget = Math.max(
      this.config.minBufferLength,
      this.config.targetBufferLength * 0.8
    );

    this.emit('adjustBufferTarget', newTarget);
  }

  private setupStallDetection() {
    this.stallDetector.on('stallStart', () => {
      console.warn('Playback stall detected');
      this.emit('stallDetected');
    });

    this.stallDetector.on('stallEnd', (duration: number) => {
      console.log(`Stall ended after ${duration}ms`);
      this.emit('stallResolved', duration);
    });
  }

  private configurePreloading() {
    this.preloadManager.configure({
      preloadWindow: this.config.preloadWindow,
      maxPreloadSegments: this.config.maxPreloadSegments,
    });
  }

  private reportBufferMetrics(bufferInfo: BufferInfo) {
    const metrics = {
      bufferLength: bufferInfo.length,
      bufferHealth: bufferInfo.health,
      bufferHoles: bufferInfo.holes.length,
      bufferPercentage: bufferInfo.percentage,
      timestamp: Date.now(),
    };

    this.emit('bufferMetrics', metrics);
  }

  private emit(event: string, data?: any) {
    // Event emission logic
    window.dispatchEvent(new CustomEvent(`buffer:${event}`, { detail: data }));
  }
}

interface BufferConfig {
  targetBufferLength: number;
  minBufferLength: number;
  maxBufferLength: number;
  criticalBufferLevel: number;
  minBufferLevel: number;
  optimalBufferLevel: number;
  maxBufferHoles: number;
  pauseOnCriticalBuffer: boolean;
  preloadWindow: number;
  maxPreloadSegments: number;
}

interface BufferInfo {
  length: number;
  start: number;
  end: number;
  holes: BufferHole[];
  percentage: number;
  health: BufferHealthStatus;
}

interface BufferHole {
  start: number;
  end: number;
  duration: number;
}

type BufferHealthStatus = 'critical' | 'low' | 'fragmented' | 'good' | 'excellent';
```

## Network Resilience Patterns

### Network Resilience Manager

```typescript
// src/streaming/NetworkResilience.ts
export class NetworkResilienceManager {
  private retryStrategy: RetryStrategy;
  private circuitBreaker: CircuitBreaker;
  private connectionMonitor: ConnectionMonitor;
  private requestQueue: RequestQueue;

  constructor(config: ResilienceConfig) {
    this.retryStrategy = new RetryStrategy(config.retry);
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.connectionMonitor = new ConnectionMonitor();
    this.requestQueue = new RequestQueue(config.queue);
  }

  public async fetchWithResilience(url: string, options?: RequestInit): Promise<Response> {
    // Check circuit breaker
    if (this.circuitBreaker.isOpen()) {
      throw new Error('Circuit breaker is open - service unavailable');
    }

    // Check connection status
    if (!this.connectionMonitor.isOnline()) {
      return this.handleOffline(url, options);
    }

    try {
      // Attempt fetch with retry logic
      const response = await this.retryStrategy.execute(
        () => this.performFetch(url, options)
      );

      // Record success
      this.circuitBreaker.recordSuccess();
      return response;

    } catch (error) {
      // Record failure
      this.circuitBreaker.recordFailure();

      // Queue for retry if appropriate
      if (this.shouldQueue(error)) {
        return this.requestQueue.enqueue(url, options);
      }

      throw error;
    }
  }

  private async performFetch(url: string, options?: RequestInit): Promise<Response> {
    const timeout = this.getAdaptiveTimeout();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}`, response.status);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout', 0);
      }

      throw error;
    }
  }

  private getAdaptiveTimeout(): number {
    const connection = (navigator as any).connection;

    if (!connection) {
      return 10000; // Default 10 seconds
    }

    // Adapt timeout based on connection quality
    switch (connection.effectiveType) {
      case '4g':
        return 5000;
      case '3g':
        return 15000;
      case '2g':
        return 30000;
      default:
        return 10000;
    }
  }

  private handleOffline(url: string, options?: RequestInit): Promise<Response> {
    // Check if resource is in cache
    if ('caches' in window) {
      return caches.match(url).then(response => {
        if (response) {
          console.log('Serving from cache while offline');
          return response;
        }

        throw new NetworkError('Offline - no cached version available', 0);
      });
    }

    throw new NetworkError('Offline', 0);
  }

  private shouldQueue(error: any): boolean {
    // Queue if temporary network issue
    return error instanceof NetworkError &&
           (error.status === 0 || error.status >= 500);
  }
}

// Retry Strategy with exponential backoff
class RetryStrategy {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === this.config.maxAttempts) {
          break;
        }

        if (!this.isRetryable(error)) {
          throw error;
        }

        const delay = this.calculateDelay(attempt);
        console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryable(error: any): boolean {
    if (error instanceof NetworkError) {
      // Don't retry client errors
      return error.status === 0 || error.status >= 500;
    }

    return true;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.config.initialDelay * Math.pow(2, attempt),
      this.config.maxDelay
    );

    // Add jitter
    const jitter = Math.random() * this.config.jitterFactor * exponentialDelay;
    return exponentialDelay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Circuit Breaker pattern
class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  isOpen(): boolean {
    if (this.state === 'open') {
      // Check if we should transition to half-open
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }

    return false;
  }

  recordSuccess() {
    this.failures = 0;

    if (this.state === 'half-open') {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed';
        this.successCount = 0;
        console.log('Circuit breaker closed');
      }
    }
  }

  recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
      console.warn('Circuit breaker opened');
    }

    if (this.state === 'half-open') {
      this.state = 'open';
      this.successCount = 0;
      console.warn('Circuit breaker re-opened');
    }
  }
}

class NetworkError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

interface ResilienceConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  queue: QueueConfig;
}

interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  jitterFactor: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  resetTimeout: number;
}

interface QueueConfig {
  maxSize: number;
  processingInterval: number;
}
```

## Fallback Mechanisms

### Comprehensive Fallback System

```typescript
// src/streaming/FallbackSystem.ts
export class FallbackSystem {
  private fallbackChain: FallbackStrategy[];
  private currentStrategy: number = 0;
  private player: videojs.Player;

  constructor(player: videojs.Player) {
    this.player = player;
    this.fallbackChain = this.buildFallbackChain();
  }

  private buildFallbackChain(): FallbackStrategy[] {
    return [
      new QualityReductionStrategy(),
      new ProtocolSwitchStrategy(),
      new CDNFailoverStrategy(),
      new OfflinePlaybackStrategy(),
      new EmergencyStreamStrategy(),
    ];
  }

  public async handlePlaybackFailure(error: PlaybackError): Promise<boolean> {
    console.error('Playback failure:', error);

    while (this.currentStrategy < this.fallbackChain.length) {
      const strategy = this.fallbackChain[this.currentStrategy];

      if (strategy.canHandle(error)) {
        try {
          const result = await strategy.execute(this.player, error);

          if (result.success) {
            console.log(`Fallback successful: ${strategy.getName()}`);
            this.resetStrategies();
            return true;
          }
        } catch (strategyError) {
          console.error(`Fallback strategy failed: ${strategy.getName()}`, strategyError);
        }
      }

      this.currentStrategy++;
    }

    // All fallbacks exhausted
    this.handleFatalError(error);
    return false;
  }

  private resetStrategies() {
    this.currentStrategy = 0;
    this.fallbackChain.forEach(strategy => strategy.reset());
  }

  private handleFatalError(error: PlaybackError) {
    console.error('Fatal error - all fallback strategies exhausted');

    this.player.error({
      code: 4,
      message: 'Unable to play video. Please try again later.',
      originalError: error,
    });

    // Report to monitoring
    this.reportFatalError(error);
  }

  private reportFatalError(error: PlaybackError) {
    // Send to analytics/monitoring service
    if (window.errorReporting) {
      window.errorReporting.log({
        level: 'fatal',
        error: error.message,
        context: {
          videoId: this.player.currentSrc(),
          timestamp: Date.now(),
          fallbacksAttempted: this.currentStrategy,
        },
      });
    }
  }
}

abstract class FallbackStrategy {
  abstract getName(): string;
  abstract canHandle(error: PlaybackError): boolean;
  abstract execute(player: videojs.Player, error: PlaybackError): Promise<FallbackResult>;

  reset() {
    // Override in subclasses if needed
  }
}

class QualityReductionStrategy extends FallbackStrategy {
  private attemptedLevels: Set<number> = new Set();

  getName() {
    return 'Quality Reduction';
  }

  canHandle(error: PlaybackError): boolean {
    return error.type === 'network' || error.type === 'decode';
  }

  async execute(player: videojs.Player, error: PlaybackError): Promise<FallbackResult> {
    const qualityLevels = player.qualityLevels();

    if (!qualityLevels || qualityLevels.length === 0) {
      return { success: false };
    }

    // Find next lower quality level
    const currentLevel = player.qualityLevels().selectedIndex;
    let targetLevel = currentLevel - 1;

    while (targetLevel >= 0 && this.attemptedLevels.has(targetLevel)) {
      targetLevel--;
    }

    if (targetLevel < 0) {
      return { success: false };
    }

    // Switch to lower quality
    this.attemptedLevels.add(targetLevel);
    player.qualityLevels().selectedIndex = targetLevel;

    // Wait for quality switch
    await this.waitForQualitySwitch(player);

    return { success: true };
  }

  private waitForQualitySwitch(player: videojs.Player): Promise<void> {
    return new Promise(resolve => {
      const handler = () => {
        player.off('qualitychange', handler);
        resolve();
      };

      player.on('qualitychange', handler);
      setTimeout(resolve, 5000); // Timeout after 5 seconds
    });
  }

  reset() {
    this.attemptedLevels.clear();
  }
}

interface PlaybackError {
  type: 'network' | 'decode' | 'source' | 'drm';
  message: string;
  code?: number;
  details?: any;
}

interface FallbackResult {
  success: boolean;
  message?: string;
}
```

## Cache Strategies

### Advanced Caching System

```typescript
// src/streaming/CacheManager.ts
export class CacheManager {
  private cacheStorage: CacheStorage;
  private cacheName: string = 'video-cache-v1';
  private strategy: CacheStrategy;
  private storageQuota: StorageQuota;

  constructor(strategy: CacheStrategyType = 'moderate') {
    this.cacheStorage = caches;
    this.strategy = this.createStrategy(strategy);
    this.storageQuota = new StorageQuota();
    this.initialize();
  }

  private async initialize() {
    // Register service worker for advanced caching
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/sw.js');
    }

    // Clean up old caches
    await this.cleanupOldCaches();

    // Monitor storage quota
    this.monitorStorageQuota();
  }

  private createStrategy(type: CacheStrategyType): CacheStrategy {
    switch (type) {
      case 'aggressive':
        return new AggressiveCacheStrategy();
      case 'moderate':
        return new ModerateCacheStrategy();
      case 'minimal':
        return new MinimalCacheStrategy();
      default:
        return new ModerateCacheStrategy();
    }
  }

  public async cacheVideo(url: string, response: Response): Promise<void> {
    if (!this.strategy.shouldCache(url, response)) {
      return;
    }

    const cache = await this.cacheStorage.open(this.cacheName);

    // Check storage availability
    const available = await this.storageQuota.checkAvailability(response);
    if (!available) {
      await this.makeSpace(response);
    }

    // Cache with metadata
    const cacheResponse = await this.addMetadata(response);
    await cache.put(url, cacheResponse);

    console.log(`Cached: ${url}`);
  }

  public async getCached(url: string): Promise<Response | null> {
    const cache = await this.cacheStorage.open(this.cacheName);
    const response = await cache.match(url);

    if (response) {
      // Check if cache is still valid
      if (this.isCacheValid(response)) {
        console.log(`Cache hit: ${url}`);
        return response;
      } else {
        // Invalid cache, remove it
        await cache.delete(url);
      }
    }

    return null;
  }

  private async addMetadata(response: Response): Promise<Response> {
    const headers = new Headers(response.headers);
    headers.set('X-Cache-Time', Date.now().toString());
    headers.set('X-Cache-Strategy', this.strategy.getName());

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  }

  private isCacheValid(response: Response): boolean {
    const cacheTime = parseInt(response.headers.get('X-Cache-Time') || '0');
    const maxAge = this.strategy.getMaxAge();

    return Date.now() - cacheTime < maxAge;
  }

  private async makeSpace(newResponse: Response): Promise<void> {
    const cache = await this.cacheStorage.open(this.cacheName);
    const requests = await cache.keys();

    // Get cache entries with metadata
    const entries = await Promise.all(
      requests.map(async request => {
        const response = await cache.match(request);
        return {
          request,
          response,
          cacheTime: parseInt(response?.headers.get('X-Cache-Time') || '0'),
          size: parseInt(response?.headers.get('Content-Length') || '0'),
        };
      })
    );

    // Sort by LRU (Least Recently Used)
    entries.sort((a, b) => a.cacheTime - b.cacheTime);

    // Remove oldest entries until we have space
    const requiredSpace = parseInt(newResponse.headers.get('Content-Length') || '0');
    let freedSpace = 0;

    for (const entry of entries) {
      if (freedSpace >= requiredSpace) {
        break;
      }

      await cache.delete(entry.request);
      freedSpace += entry.size;
      console.log(`Evicted from cache: ${entry.request.url}`);
    }
  }

  private async cleanupOldCaches() {
    const cacheNames = await this.cacheStorage.keys();

    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('video-cache-') && name !== this.cacheName)
        .map(name => this.cacheStorage.delete(name))
    );
  }

  private async monitorStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();

      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentUsed = (usage / quota) * 100;

      console.log(`Storage: ${(usage / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB (${percentUsed.toFixed(2)}%)`);

      if (percentUsed > 90) {
        console.warn('Storage quota nearly exhausted');
        await this.performEmergencyCleanup();
      }
    }
  }

  private async performEmergencyCleanup() {
    const cache = await this.cacheStorage.open(this.cacheName);
    const requests = await cache.keys();

    // Delete 25% of oldest entries
    const toDelete = Math.floor(requests.length * 0.25);

    for (let i = 0; i < toDelete; i++) {
      await cache.delete(requests[i]);
    }

    console.log(`Emergency cleanup: removed ${toDelete} cache entries`);
  }

  public async preloadSegments(urls: string[]): Promise<void> {
    const cache = await this.cacheStorage.open(this.cacheName);

    await Promise.all(
      urls.map(async url => {
        // Check if already cached
        const cached = await cache.match(url);
        if (cached) return;

        try {
          const response = await fetch(url);
          if (response.ok) {
            await this.cacheVideo(url, response.clone());
          }
        } catch (error) {
          console.error(`Failed to preload: ${url}`, error);
        }
      })
    );
  }

  public async clearCache(): Promise<void> {
    await this.cacheStorage.delete(this.cacheName);
    console.log('Cache cleared');
  }
}

abstract class CacheStrategy {
  abstract getName(): string;
  abstract shouldCache(url: string, response: Response): boolean;
  abstract getMaxAge(): number;
}

class AggressiveCacheStrategy extends CacheStrategy {
  getName() {
    return 'aggressive';
  }

  shouldCache(url: string, response: Response): boolean {
    // Cache everything
    return response.ok;
  }

  getMaxAge(): number {
    return 7 * 24 * 60 * 60 * 1000; // 7 days
  }
}

class ModerateCacheStrategy extends CacheStrategy {
  getName() {
    return 'moderate';
  }

  shouldCache(url: string, response: Response): boolean {
    // Cache video segments and manifests
    const isVideo = /\.(ts|m4s|mp4|webm|m3u8|mpd)$/i.test(url);
    return response.ok && isVideo;
  }

  getMaxAge(): number {
    return 24 * 60 * 60 * 1000; // 1 day
  }
}

class MinimalCacheStrategy extends CacheStrategy {
  getName() {
    return 'minimal';
  }

  shouldCache(url: string, response: Response): boolean {
    // Only cache manifests
    const isManifest = /\.(m3u8|mpd)$/i.test(url);
    return response.ok && isManifest;
  }

  getMaxAge(): number {
    return 60 * 60 * 1000; // 1 hour
  }
}

type CacheStrategyType = 'aggressive' | 'moderate' | 'minimal';
```

## Performance Optimization

### Performance Monitoring and Optimization

```typescript
// src/streaming/PerformanceOptimizer.ts
export class PerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private optimizations: OptimizationStrategy[];

  constructor() {
    this.metrics = new PerformanceMetrics();
    this.optimizations = [
      new PreloadOptimization(),
      new BitrateOptimization(),
      new BufferOptimization(),
      new NetworkOptimization(),
    ];
  }

  public async optimizePlayback(player: videojs.Player): Promise<void> {
    const currentMetrics = await this.metrics.collect(player);

    for (const optimization of this.optimizations) {
      if (optimization.shouldApply(currentMetrics)) {
        await optimization.apply(player, currentMetrics);
      }
    }
  }

  public getMetricsSummary(): MetricsSummary {
    return this.metrics.getSummary();
  }
}

class PerformanceMetrics {
  private samples: MetricSample[] = [];

  async collect(player: videojs.Player): Promise<MetricSample> {
    const sample: MetricSample = {
      timestamp: Date.now(),
      bufferHealth: this.getBufferHealth(player),
      networkSpeed: await this.measureNetworkSpeed(),
      droppedFrames: this.getDroppedFrames(player),
      latency: await this.measureLatency(),
      cpuUsage: this.estimateCPUUsage(),
      memoryUsage: this.getMemoryUsage(),
    };

    this.samples.push(sample);
    this.cleanOldSamples();

    return sample;
  }

  private getBufferHealth(player: videojs.Player): number {
    const buffered = player.buffered();
    const currentTime = player.currentTime();

    if (buffered.length === 0) return 0;

    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
        return buffered.end(i) - currentTime;
      }
    }

    return 0;
  }

  private async measureNetworkSpeed(): Promise<number> {
    // Implement network speed measurement
    return 10000000; // 10 Mbps placeholder
  }

  private getDroppedFrames(player: videojs.Player): number {
    const video = player.el().querySelector('video') as HTMLVideoElement;

    if (video && video.getVideoPlaybackQuality) {
      const quality = video.getVideoPlaybackQuality();
      return quality.droppedVideoFrames;
    }

    return 0;
  }

  private async measureLatency(): Promise<number> {
    const start = performance.now();
    await fetch('/ping', { method: 'HEAD' });
    return performance.now() - start;
  }

  private estimateCPUUsage(): number {
    // Estimate based on frame timing
    return 50; // Placeholder
  }

  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private cleanOldSamples() {
    const cutoff = Date.now() - 60000; // Keep last minute
    this.samples = this.samples.filter(s => s.timestamp > cutoff);
  }

  getSummary(): MetricsSummary {
    // Calculate averages and trends
    return {
      avgBufferHealth: this.average(this.samples.map(s => s.bufferHealth)),
      avgNetworkSpeed: this.average(this.samples.map(s => s.networkSpeed)),
      totalDroppedFrames: this.sum(this.samples.map(s => s.droppedFrames)),
      avgLatency: this.average(this.samples.map(s => s.latency)),
      avgCPUUsage: this.average(this.samples.map(s => s.cpuUsage)),
      avgMemoryUsage: this.average(this.samples.map(s => s.memoryUsage)),
    };
  }

  private average(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length || 0;
  }

  private sum(values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }
}

interface MetricSample {
  timestamp: number;
  bufferHealth: number;
  networkSpeed: number;
  droppedFrames: number;
  latency: number;
  cpuUsage: number;
  memoryUsage: number;
}

interface MetricsSummary {
  avgBufferHealth: number;
  avgNetworkSpeed: number;
  totalDroppedFrames: number;
  avgLatency: number;
  avgCPUUsage: number;
  avgMemoryUsage: number;
}
```

## Best Practices

### Streaming Implementation Guidelines

1. **Adaptive Streaming**
   - Always implement ABR for optimal user experience
   - Start with conservative quality estimates
   - Monitor real-world performance metrics

2. **Buffer Management**
   - Target 10-30 seconds of buffer for VOD
   - Target 3-10 seconds for live streaming
   - Implement intelligent prefetching

3. **Network Resilience**
   - Implement exponential backoff for retries
   - Use circuit breakers for failing services
   - Provide offline fallbacks where possible

4. **CDN Strategy**
   - Use multi-CDN for redundancy
   - Implement geo-based CDN selection
   - Monitor CDN performance continuously

5. **Caching**
   - Cache manifests aggressively
   - Cache segments based on popularity
   - Respect user storage preferences

6. **Error Handling**
   - Provide clear error messages
   - Implement automatic recovery
   - Log errors for monitoring

## Resources

- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- [DASH Specification](https://www.iso.org/standard/79329.html)
- [Video.js HTTP Streaming](https://github.com/videojs/http-streaming)
- [Web Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)