# Video Player API Contracts

Standard API contracts and interfaces for video player implementations.

## Player Core API

### Initialization

```typescript
interface PlayerConfig {
  // Required
  container: string | HTMLElement;

  // Media source
  source?: MediaSource | MediaSource[];

  // Basic options
  autoplay?: boolean | 'muted' | 'any';
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';

  // Dimensions
  width?: number | string;
  height?: number | string;
  aspectRatio?: string; // "16:9", "4:3", etc.
  fluid?: boolean;
  fill?: boolean;

  // Advanced options
  playbackRates?: number[];
  defaultPlaybackRate?: number;
  volume?: number; // 0.0 to 1.0

  // Plugin configuration
  plugins?: PluginConfig[];

  // Event handlers
  onReady?: () => void;
  onError?: (error: PlayerError) => void;
}

interface MediaSource {
  src: string;
  type?: string; // MIME type
  label?: string; // Quality label
  resolution?: string; // "1080p", "720p", etc.
  bitrate?: number; // in bps
  codecs?: string; // codec string
  drm?: DRMConfig;
}
```

### Player Instance Methods

```typescript
interface Player {
  // Lifecycle
  load(source: MediaSource | MediaSource[]): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  destroy(): void;

  // Seeking
  seek(time: number): void;
  seekForward(seconds: number): void;
  seekBackward(seconds: number): void;

  // State getters
  getCurrentTime(): number;
  getDuration(): number;
  getBuffered(): TimeRanges;
  getPlaybackRate(): number;
  getVolume(): number;
  getMuted(): boolean;
  getReadyState(): number;
  getNetworkState(): number;
  getError(): PlayerError | null;

  // State setters
  setCurrentTime(time: number): void;
  setPlaybackRate(rate: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;

  // Quality
  getQualityLevels(): QualityLevel[];
  getCurrentQuality(): QualityLevel;
  setQuality(levelIndex: number | 'auto'): void;

  // Tracks
  getAudioTracks(): AudioTrack[];
  getVideoTracks(): VideoTrack[];
  getTextTracks(): TextTrack[];
  setAudioTrack(index: number): void;
  setVideoTrack(index: number): void;
  addTextTrack(track: TextTrackConfig): TextTrack;

  // UI
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  enterPictureInPicture(): Promise<void>;
  exitPictureInPicture(): Promise<void>;

  // Events
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  once(event: string, handler: EventHandler): void;
  emit(event: string, data?: any): void;

  // Plugin API
  registerPlugin(name: string, plugin: Plugin): void;
  getPlugin(name: string): Plugin | null;
}
```

## Event API

### Standard Player Events

```typescript
interface PlayerEvents {
  // Lifecycle events
  'ready': void;
  'loadstart': void;
  'loadedmetadata': MediaMetadata;
  'loadeddata': void;
  'canplay': void;
  'canplaythrough': void;

  // Playback events
  'play': void;
  'playing': void;
  'pause': void;
  'ended': void;
  'seeking': { currentTime: number };
  'seeked': { currentTime: number };

  // Progress events
  'timeupdate': { currentTime: number; duration: number };
  'progress': { buffered: TimeRanges };
  'durationchange': { duration: number };

  // State events
  'volumechange': { volume: number; muted: boolean };
  'ratechange': { playbackRate: number };
  'fullscreenchange': { isFullscreen: boolean };

  // Quality events
  'qualitychange': {
    previousQuality: QualityLevel;
    currentQuality: QualityLevel;
    isAuto: boolean;
  };
  'qualitylevelschange': { levels: QualityLevel[] };

  // Error events
  'error': PlayerError;
  'warning': PlayerWarning;

  // Network events
  'waiting': void;
  'stalled': void;
  'suspend': void;
  'abort': void;
  'emptied': void;
}
```

### Analytics Events

```typescript
interface AnalyticsEvents {
  'analytics:session:start': {
    sessionId: string;
    timestamp: number;
    userAgent: string;
    viewport: { width: number; height: number };
  };

  'analytics:playback:start': {
    contentId: string;
    contentType: 'vod' | 'live';
    startupTime: number;
    autoplay: boolean;
  };

  'analytics:quality:change': {
    from: QualityLevel;
    to: QualityLevel;
    reason: 'manual' | 'auto' | 'startup';
    bandwidth: number;
  };

  'analytics:buffer': {
    type: 'start' | 'end';
    duration?: number;
    position: number;
  };

  'analytics:error': {
    code: string;
    message: string;
    severity: 'fatal' | 'warning';
    technical: any;
  };

  'analytics:session:end': {
    watchTime: number;
    bufferingTime: number;
    bufferingCount: number;
    averageBitrate: number;
    qualityChanges: number;
  };
}
```

## Plugin API

### Plugin Interface

```typescript
interface Plugin {
  name: string;
  version: string;

  // Lifecycle
  init(player: Player, config?: any): void;
  destroy(): void;

  // Optional hooks
  beforePlay?(): void | Promise<void>;
  afterPlay?(): void;
  beforeSeek?(time: number): void | boolean;
  afterSeek?(time: number): void;

  // UI extensions
  createUI?(): HTMLElement;
  updateUI?(state: PlayerState): void;
}

// Example plugin
class CustomPlugin implements Plugin {
  name = 'custom-plugin';
  version = '1.0.0';

  private player: Player;

  init(player: Player, config?: any) {
    this.player = player;
    this.player.on('play', this.handlePlay.bind(this));
  }

  destroy() {
    this.player.off('play', this.handlePlay.bind(this));
  }

  private handlePlay() {
    console.log('Custom plugin: playback started');
  }
}
```

## DRM API

### DRM Configuration

```typescript
interface DRMConfig {
  type: 'widevine' | 'playready' | 'fairplay' | 'clearkey';
  licenseUrl: string;
  certificateUrl?: string;
  headers?: Record<string, string>;

  // Advanced options
  persistentState?: 'optional' | 'required';
  distinctiveIdentifier?: 'optional' | 'required';
  sessionType?: 'temporary' | 'persistent';

  // License request modification
  getLicense?: (challenge: Uint8Array) => Promise<Uint8Array>;

  // Fairplay specific
  fairplayOptions?: {
    certificateUrl: string;
    licenseUrl: string;
    contentId: string;
  };
}
```

### DRM Events

```typescript
interface DRMEvents {
  'drm:license:request': {
    type: string;
    url: string;
  };

  'drm:license:response': {
    type: string;
    duration: number;
  };

  'drm:license:error': {
    type: string;
    error: Error;
  };

  'drm:key:status': {
    keyId: string;
    status: 'usable' | 'expired' | 'released' | 'output-restricted' | 'status-pending';
  };
}
```

## Advertising API

### Ad Configuration

```typescript
interface AdConfig {
  // VAST/VMAP URLs
  adTagUrl: string;
  vmap?: string;

  // Scheduling
  schedule?: AdBreak[];

  // Options
  timeout?: number;
  preloadTime?: number;
  debug?: boolean;

  // UI
  showCountdown?: boolean;
  showAdAttribution?: boolean;
}

interface AdBreak {
  offset: number | string; // seconds or percentage
  tag: string; // VAST URL
  type: 'pre' | 'mid' | 'post';
}
```

### Ad Events

```typescript
interface AdEvents {
  'ad:break:start': { type: string; position: number };
  'ad:break:end': void;

  'ad:loaded': { ad: AdInfo };
  'ad:started': { ad: AdInfo };
  'ad:impression': { ad: AdInfo };
  'ad:paused': void;
  'ad:resumed': void;
  'ad:skipped': void;
  'ad:completed': void;

  'ad:error': { error: Error; ad?: AdInfo };
  'ad:click': { url: string };
}
```

## Quality API

### Quality Levels

```typescript
interface QualityLevel {
  id: string;
  index: number;
  label: string;

  // Video properties
  width: number;
  height: number;
  bitrate: number;
  framerate?: number;
  codecs?: string;

  // State
  enabled: boolean;
  active: boolean;
}

interface QualityController {
  levels: QualityLevel[];
  currentLevel: number; // -1 for auto
  nextLevel: number;

  // Control
  setLevel(index: number | 'auto'): void;
  enableLevel(index: number): void;
  disableLevel(index: number): void;

  // Auto quality
  autoLevelEnabled: boolean;
  autoLevelCapping: number; // Max auto level

  // Events
  on(event: 'levelchange', handler: (level: QualityLevel) => void): void;
}
```

## Network API

### Bandwidth Estimation

```typescript
interface NetworkStats {
  bandwidth: number; // bits per second
  latency: number; // milliseconds
  downloadTime: number; // milliseconds
  ttfb: number; // time to first byte
}

interface NetworkController {
  // Current stats
  getBandwidth(): number;
  getLatency(): number;
  getNetworkStats(): NetworkStats;

  // Configuration
  setBandwidthEstimate(bps: number): void;
  setABRStrategy(strategy: 'conservative' | 'aggressive' | 'balanced'): void;
}
```

## Error Handling

### Error Types

```typescript
enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  MANIFEST_LOAD_ERROR = 'MANIFEST_LOAD_ERROR',
  MANIFEST_PARSE_ERROR = 'MANIFEST_PARSE_ERROR',
  SEGMENT_LOAD_ERROR = 'SEGMENT_LOAD_ERROR',

  // Media errors
  MEDIA_DECODE_ERROR = 'MEDIA_DECODE_ERROR',
  MEDIA_FORMAT_ERROR = 'MEDIA_FORMAT_ERROR',
  MEDIA_ABORTED = 'MEDIA_ABORTED',

  // DRM errors
  DRM_LICENSE_ERROR = 'DRM_LICENSE_ERROR',
  DRM_KEY_ERROR = 'DRM_KEY_ERROR',
  DRM_OUTPUT_RESTRICTED = 'DRM_OUTPUT_RESTRICTED',

  // Other
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface PlayerError {
  code: ErrorCode;
  message: string;
  details?: any;
  fatal: boolean;
  recoverable: boolean;

  // Recovery hints
  retryAfter?: number;
  fallbackUrl?: string;
}
```

## REST API Contracts

### Manifest API

```typescript
// GET /manifest/{contentId}
interface ManifestResponse {
  version: string;
  content: {
    id: string;
    title: string;
    duration: number;
    type: 'vod' | 'live';
  };
  sources: MediaSource[];
  tracks?: {
    subtitles?: TextTrackConfig[];
    audio?: AudioTrackConfig[];
  };
  drm?: DRMConfig;
  ads?: AdConfig;
}
```

### Analytics API

```typescript
// POST /analytics/events
interface AnalyticsPayload {
  sessionId: string;
  events: Array<{
    timestamp: number;
    type: string;
    data: any;
  }>;
}

// Response
interface AnalyticsResponse {
  received: number;
  processed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}
```

### License API

```typescript
// POST /drm/license
interface LicenseRequest {
  contentId: string;
  challenge: string; // Base64 encoded
  sessionId: string;
  drmType: string;
}

interface LicenseResponse {
  license: string; // Base64 encoded
  expiry?: number;
  restrictions?: {
    maxResolution?: string;
    hdcpVersion?: string;
  };
}
```

## WebSocket API

### Real-time Events

```typescript
// Connection
interface WSConnection {
  url: string;
  protocols?: string[];
  reconnect?: boolean;
  reconnectDelay?: number;
}

// Message types
interface WSMessage {
  type: 'heartbeat' | 'stats' | 'command' | 'event';
  timestamp: number;
  data: any;
}

// Stats reporting
interface StatsMessage extends WSMessage {
  type: 'stats';
  data: {
    bandwidth: number;
    bufferLevel: number;
    droppedFrames: number;
    bitrate: number;
    latency: number;
  };
}

// Remote control
interface CommandMessage extends WSMessage {
  type: 'command';
  data: {
    action: 'play' | 'pause' | 'seek' | 'setQuality';
    params?: any;
  };
}
```

## Usage Examples

### Basic Player Setup

```javascript
const player = new VideoPlayer({
  container: '#player',
  source: {
    src: 'https://example.com/video.m3u8',
    type: 'application/x-mpegURL'
  },
  autoplay: 'muted',
  plugins: [
    { name: 'analytics', config: { endpoint: '/api/analytics' } },
    { name: 'quality-selector' }
  ]
});

// Event handling
player.on('ready', () => {
  console.log('Player ready');
});

player.on('error', (error) => {
  if (error.recoverable) {
    player.retry();
  } else {
    showErrorMessage(error.message);
  }
});
```

### Advanced DRM Setup

```javascript
const player = new VideoPlayer({
  container: '#player',
  source: {
    src: 'https://example.com/encrypted.mpd',
    type: 'application/dash+xml',
    drm: {
      type: 'widevine',
      licenseUrl: 'https://license.example.com/widevine',
      headers: {
        'X-Custom-Header': 'value'
      },
      getLicense: async (challenge) => {
        const response = await fetch(licenseUrl, {
          method: 'POST',
          body: challenge,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });
        return response.arrayBuffer();
      }
    }
  }
});
```

## Version History

- **v1.0.0** - Initial API specification
- **v1.1.0** - Added DRM support
- **v1.2.0** - Enhanced quality switching API
- **v2.0.0** - TypeScript definitions, plugin system
- **v2.1.0** - WebSocket support for real-time features

---

This document defines the standard API contracts for video player implementations. Adhering to these contracts ensures consistency and interoperability across different player implementations.