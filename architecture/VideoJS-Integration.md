# Video.js Integration with Next.js

## Overview

This document outlines the comprehensive strategy for integrating Video.js with Next.js, covering React component patterns, server-side rendering considerations, and custom development approaches.

## Table of Contents

1. [Integration Architecture](#integration-architecture)
2. [React Component Wrapper Strategy](#react-component-wrapper-strategy)
3. [Server-Side Rendering Considerations](#server-side-rendering-considerations)
4. [Plugin Architecture](#plugin-architecture)
5. [Custom Component Development](#custom-component-development)
6. [Event Handling Patterns](#event-handling-patterns)
7. [State Synchronization](#state-synchronization)

## Integration Architecture

### Core Architecture Principles

- **Lazy Loading**: Video.js should be loaded only when needed
- **Type Safety**: Full TypeScript support throughout the integration
- **Performance First**: Minimize bundle size and optimize rendering
- **SSR Compatibility**: Ensure components work in both client and server environments

### Component Hierarchy

```
┌─────────────────────────────────────┐
│         Next.js App Router          │
├─────────────────────────────────────┤
│     VideoPlayerProvider (Context)   │
├─────────────────────────────────────┤
│      VideoPlayer (Wrapper)          │
├─────────────────────────────────────┤
│         Video.js Core               │
├─────────────────────────────────────┤
│    Plugins | Controls | Overlays    │
└─────────────────────────────────────┘
```

## React Component Wrapper Strategy

### Base Video Player Component

```typescript
// components/VideoPlayer/VideoPlayer.tsx
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  options: videojs.PlayerOptions;
  onReady?: (player: Player) => void;
  onError?: (error: MediaError) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  options,
  onReady,
  onError,
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // Ensure Video.js is only initialized on client
    if (!videoRef.current) return;

    // Initialize player
    const videoElement = document.createElement('video-js');
    videoElement.classList.add('vjs-big-play-centered');
    videoRef.current.appendChild(videoElement);

    const player = playerRef.current = videojs(videoElement, {
      ...options,
      // Default options
      controls: true,
      responsive: true,
      fluid: true,
      ...options
    }, function onPlayerReady() {
      console.log('Player is ready');
      onReady?.(player);
    });

    // Event listeners
    player.on('error', () => {
      const error = player.error();
      if (error) {
        onError?.(error);
      }
    });

    player.on('timeupdate', () => {
      onTimeUpdate?.(player.currentTime());
    });

    // Cleanup
    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Update source dynamically
  useEffect(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;

    if (options.sources) {
      player.src(options.sources);
    }
  }, [options.sources]);

  return <div data-vjs-player ref={videoRef} />;
};
```

### Advanced Wrapper with Hooks

```typescript
// hooks/useVideoPlayer.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';

interface UseVideoPlayerOptions {
  autoplay?: boolean;
  controls?: boolean;
  sources: videojs.Tech.SourceObject[];
  onReady?: (player: Player) => void;
}

export const useVideoPlayer = (options: UseVideoPlayerOptions) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    playerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    const player = videojs(videoRef.current, options, function onPlayerReady() {
      setIsReady(true);
      setDuration(player.duration() || 0);
      options.onReady?.(player);
    });

    playerRef.current = player;

    // Event handlers
    player.on('timeupdate', () => setCurrentTime(player.currentTime()));
    player.on('durationchange', () => setDuration(player.duration() || 0));
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    player: playerRef.current,
    isReady,
    currentTime,
    duration,
    isPlaying,
    play,
    pause,
    seek
  };
};
```

## Server-Side Rendering Considerations

### Dynamic Import Strategy

```typescript
// components/VideoPlayer/DynamicVideoPlayer.tsx
import dynamic from 'next/dynamic';
import { VideoPlayerProps } from './VideoPlayer';

const VideoPlayer = dynamic<VideoPlayerProps>(
  () => import('./VideoPlayer').then(mod => mod.VideoPlayer),
  {
    ssr: false,
    loading: () => <VideoPlayerSkeleton />
  }
);

// Skeleton loader for better UX
const VideoPlayerSkeleton = () => (
  <div className="video-skeleton">
    <div className="video-skeleton-aspect">
      <div className="video-skeleton-play-button" />
    </div>
  </div>
);

export default VideoPlayer;
```

### Window Object Checks

```typescript
// utils/videojs-ssr.ts
export const initializeVideoJS = async () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const videojs = (await import('video.js')).default;

  // Register plugins only on client
  if (typeof window !== 'undefined') {
    // Import plugins dynamically
    const qualityLevels = await import('videojs-contrib-quality-levels');
    videojs.registerPlugin('qualityLevels', qualityLevels.default);
  }

  return videojs;
};
```

### Next.js App Router Integration

```typescript
// app/video/[id]/page.tsx
import { Metadata } from 'next';
import VideoPlayer from '@/components/VideoPlayer/DynamicVideoPlayer';

export const metadata: Metadata = {
  title: 'Video Player',
};

interface VideoPageProps {
  params: { id: string };
}

export default async function VideoPage({ params }: VideoPageProps) {
  // Fetch video metadata on server
  const videoData = await fetchVideoMetadata(params.id);

  return (
    <div className="video-container">
      <VideoPlayer
        options={{
          sources: [{
            src: videoData.streamUrl,
            type: videoData.mimeType
          }],
          poster: videoData.thumbnail
        }}
      />
    </div>
  );
}
```

## Plugin Architecture

### Custom Plugin Development

```typescript
// plugins/custom-analytics/index.ts
import videojs from 'video.js';

const Plugin = videojs.getPlugin('plugin');

interface AnalyticsOptions {
  endpoint: string;
  userId?: string;
  sessionId: string;
}

class AnalyticsPlugin extends Plugin {
  private options: AnalyticsOptions;
  private watchTime: number = 0;
  private events: Array<{
    type: string;
    timestamp: number;
    data?: any;
  }> = [];

  constructor(player: videojs.Player, options: AnalyticsOptions) {
    super(player);
    this.options = options;

    // Track events
    this.player.on('play', this.onPlay.bind(this));
    this.player.on('pause', this.onPause.bind(this));
    this.player.on('ended', this.onEnded.bind(this));
    this.player.on('error', this.onError.bind(this));

    // Track watch time
    this.player.on('timeupdate', this.trackWatchTime.bind(this));

    // Send beacon on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.sendAnalytics.bind(this));
    }
  }

  private onPlay() {
    this.logEvent('play', {
      currentTime: this.player.currentTime(),
      duration: this.player.duration()
    });
  }

  private onPause() {
    this.logEvent('pause', {
      currentTime: this.player.currentTime(),
      watchTime: this.watchTime
    });
  }

  private onEnded() {
    this.logEvent('ended', {
      watchTime: this.watchTime,
      completionRate: (this.watchTime / this.player.duration()) * 100
    });
    this.sendAnalytics();
  }

  private onError() {
    const error = this.player.error();
    this.logEvent('error', {
      code: error?.code,
      message: error?.message
    });
  }

  private trackWatchTime() {
    this.watchTime = this.player.currentTime();
  }

  private logEvent(type: string, data?: any) {
    this.events.push({
      type,
      timestamp: Date.now(),
      data
    });
  }

  private async sendAnalytics() {
    try {
      await fetch(this.options.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.options.userId,
          sessionId: this.options.sessionId,
          events: this.events,
          watchTime: this.watchTime
        })
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }

  dispose() {
    this.sendAnalytics();
    super.dispose();
  }
}

// Register the plugin
videojs.registerPlugin('analytics', AnalyticsPlugin);

export default AnalyticsPlugin;
```

### Plugin Registration Pattern

```typescript
// utils/register-plugins.ts
import videojs from 'video.js';

export const registerPlugins = async () => {
  // Core plugins
  await import('videojs-contrib-quality-levels');
  await import('videojs-hls-quality-selector');

  // Custom plugins
  await import('@/plugins/custom-analytics');
  await import('@/plugins/custom-overlay');
  await import('@/plugins/custom-shortcuts');
};

// Initialize in component
useEffect(() => {
  registerPlugins().then(() => {
    // Initialize player after plugins are loaded
    initializePlayer();
  });
}, []);
```

## Custom Component Development

### Custom Control Bar Component

```typescript
// components/CustomControlBar/CustomControlBar.tsx
import videojs from 'video.js';

const Component = videojs.getComponent('Component');
const ClickableComponent = videojs.getComponent('ClickableComponent');

class CustomPlaybackRateButton extends ClickableComponent {
  private rates: number[] = [0.5, 0.75, 1, 1.25, 1.5, 2];
  private currentRateIndex: number = 2; // Default to 1x

  constructor(player: videojs.Player, options?: any) {
    super(player, options);

    this.controlText('Playback Rate');
    this.addClass('vjs-playback-rate-button');
    this.updateLabel();
  }

  buildCSSClass() {
    return `vjs-playback-rate-button ${super.buildCSSClass()}`;
  }

  handleClick() {
    this.currentRateIndex = (this.currentRateIndex + 1) % this.rates.length;
    const newRate = this.rates[this.currentRateIndex];

    this.player().playbackRate(newRate);
    this.updateLabel();
  }

  updateLabel() {
    const rate = this.rates[this.currentRateIndex];
    this.el().innerHTML = `${rate}x`;
  }
}

// Register component
videojs.registerComponent('CustomPlaybackRateButton', CustomPlaybackRateButton);

// Custom control bar configuration
export const customControlBar = {
  children: [
    'playToggle',
    'volumePanel',
    'currentTimeDisplay',
    'timeDivider',
    'durationDisplay',
    'progressControl',
    'customPlaybackRateButton',
    'pictureInPictureToggle',
    'fullscreenToggle'
  ]
};
```

### Custom Overlay System

```typescript
// components/VideoOverlay/VideoOverlay.tsx
import React, { useEffect, useState } from 'react';
import videojs from 'video.js';

interface OverlayConfig {
  id: string;
  content: React.ReactNode;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  showAt?: number; // Time in seconds
  hideAt?: number;
  className?: string;
}

class OverlayManager {
  private player: videojs.Player;
  private overlays: Map<string, OverlayConfig> = new Map();
  private container: HTMLElement;

  constructor(player: videojs.Player) {
    this.player = player;
    this.container = this.createOverlayContainer();
    this.player.el().appendChild(this.container);

    this.player.on('timeupdate', this.updateOverlays.bind(this));
  }

  private createOverlayContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'vjs-overlay-container';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    return container;
  }

  addOverlay(config: OverlayConfig) {
    this.overlays.set(config.id, config);
    this.renderOverlay(config);
  }

  removeOverlay(id: string) {
    this.overlays.delete(id);
    const element = this.container.querySelector(`[data-overlay-id="${id}"]`);
    element?.remove();
  }

  private updateOverlays() {
    const currentTime = this.player.currentTime();

    this.overlays.forEach(overlay => {
      const element = this.container.querySelector(
        `[data-overlay-id="${overlay.id}"]`
      ) as HTMLElement;

      if (!element) return;

      const shouldShow =
        (!overlay.showAt || currentTime >= overlay.showAt) &&
        (!overlay.hideAt || currentTime < overlay.hideAt);

      element.style.display = shouldShow ? 'block' : 'none';
    });
  }

  private renderOverlay(config: OverlayConfig) {
    const overlayEl = document.createElement('div');
    overlayEl.setAttribute('data-overlay-id', config.id);
    overlayEl.className = `vjs-overlay vjs-overlay-${config.position} ${config.className || ''}`;
    overlayEl.style.position = 'absolute';

    // Position styles
    const positions = {
      'top-left': { top: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' },
      'center': {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    };

    Object.assign(overlayEl.style, positions[config.position]);
    overlayEl.style.pointerEvents = 'auto';

    this.container.appendChild(overlayEl);
  }

  dispose() {
    this.container.remove();
    this.overlays.clear();
  }
}

export default OverlayManager;
```

## Event Handling Patterns

### Centralized Event Management

```typescript
// utils/video-event-manager.ts
import videojs from 'video.js';

type EventHandler = (...args: any[]) => void;

export class VideoEventManager {
  private player: videojs.Player;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventLog: Array<{ event: string; timestamp: number; data?: any }> = [];

  constructor(player: videojs.Player) {
    this.player = player;
    this.setupCoreEventListeners();
  }

  private setupCoreEventListeners() {
    const coreEvents = [
      'loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough',
      'play', 'pause', 'playing', 'ended', 'seeking', 'seeked',
      'waiting', 'timeupdate', 'progress', 'error', 'volumechange',
      'ratechange', 'resize', 'fullscreenchange'
    ];

    coreEvents.forEach(event => {
      this.player.on(event, (...args) => {
        this.logEvent(event, args);
        this.emit(event, ...args);
      });
    });
  }

  on(event: string, handler: EventHandler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]) {
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  private logEvent(event: string, data?: any) {
    this.eventLog.push({
      event,
      timestamp: Date.now(),
      data
    });

    // Keep only last 100 events
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }
  }

  getEventLog() {
    return [...this.eventLog];
  }

  dispose() {
    this.handlers.clear();
    this.eventLog = [];
  }
}

// Usage in React component
const useVideoEvents = (player: videojs.Player | null) => {
  const [eventManager, setEventManager] = useState<VideoEventManager | null>(null);

  useEffect(() => {
    if (!player) return;

    const manager = new VideoEventManager(player);
    setEventManager(manager);

    // Example event subscriptions
    const unsubscribePlay = manager.on('play', () => {
      console.log('Video started playing');
    });

    const unsubscribeError = manager.on('error', () => {
      const error = player.error();
      console.error('Video error:', error);
    });

    return () => {
      unsubscribePlay();
      unsubscribeError();
      manager.dispose();
    };
  }, [player]);

  return eventManager;
};
```

### Error Handling Strategy

```typescript
// utils/video-error-handler.ts
interface VideoError {
  code: number;
  message: string;
  timestamp: number;
  context?: any;
}

export class VideoErrorHandler {
  private errors: VideoError[] = [];
  private maxRetries: number = 3;
  private retryCount: Map<string, number> = new Map();

  handleError(player: videojs.Player, onRecover?: () => void) {
    const error = player.error();
    if (!error) return;

    this.logError(error);

    switch (error.code) {
      case 1: // MEDIA_ERR_ABORTED
        console.log('Video playback aborted');
        break;

      case 2: // MEDIA_ERR_NETWORK
        this.handleNetworkError(player, onRecover);
        break;

      case 3: // MEDIA_ERR_DECODE
        this.handleDecodeError(player);
        break;

      case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
        this.handleSourceError(player);
        break;

      default:
        console.error('Unknown error:', error);
    }
  }

  private handleNetworkError(player: videojs.Player, onRecover?: () => void) {
    const src = player.currentSrc();
    const retries = this.retryCount.get(src) || 0;

    if (retries < this.maxRetries) {
      this.retryCount.set(src, retries + 1);

      setTimeout(() => {
        console.log(`Retrying... (${retries + 1}/${this.maxRetries})`);
        player.src(player.currentSources());
        player.load();
        onRecover?.();
      }, 2000 * (retries + 1)); // Exponential backoff
    } else {
      console.error('Max retries reached for network error');
      this.switchToFallbackSource(player);
    }
  }

  private handleDecodeError(player: videojs.Player) {
    console.error('Video decode error - switching to lower quality');
    // Implement quality downgrade logic
  }

  private handleSourceError(player: videojs.Player) {
    console.error('Source not supported - trying fallback');
    this.switchToFallbackSource(player);
  }

  private switchToFallbackSource(player: videojs.Player) {
    // Implement fallback source logic
    const fallbackSources = player.options().fallbackSources;
    if (fallbackSources && fallbackSources.length > 0) {
      player.src(fallbackSources);
      player.load();
    }
  }

  private logError(error: MediaError) {
    this.errors.push({
      code: error.code || 0,
      message: error.message || 'Unknown error',
      timestamp: Date.now()
    });
  }

  getErrors() {
    return [...this.errors];
  }
}
```

## State Synchronization

### Global State Management with Context

```typescript
// context/VideoPlayerContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import videojs from 'video.js';

interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isFullscreen: boolean;
  quality: string;
  bufferedRanges: Array<{ start: number; end: number }>;
  error: MediaError | null;
}

type VideoPlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_QUALITY'; payload: string }
  | { type: 'SET_BUFFERED'; payload: Array<{ start: number; end: number }> }
  | { type: 'SET_ERROR'; payload: MediaError | null };

const initialState: VideoPlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackRate: 1,
  isFullscreen: false,
  quality: 'auto',
  bufferedRanges: [],
  error: null
};

function videoPlayerReducer(
  state: VideoPlayerState,
  action: VideoPlayerAction
): VideoPlayerState {
  switch (action.type) {
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_PLAYBACK_RATE':
      return { ...state, playbackRate: action.payload };
    case 'SET_FULLSCREEN':
      return { ...state, isFullscreen: action.payload };
    case 'SET_QUALITY':
      return { ...state, quality: action.payload };
    case 'SET_BUFFERED':
      return { ...state, bufferedRanges: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

interface VideoPlayerContextValue {
  state: VideoPlayerState;
  dispatch: React.Dispatch<VideoPlayerAction>;
  player: videojs.Player | null;
  setPlayer: (player: videojs.Player | null) => void;
}

const VideoPlayerContext = createContext<VideoPlayerContextValue | undefined>(undefined);

export const VideoPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(videoPlayerReducer, initialState);
  const [player, setPlayer] = React.useState<videojs.Player | null>(null);

  React.useEffect(() => {
    if (!player) return;

    // Sync player events with state
    const handlers = {
      play: () => dispatch({ type: 'PLAY' }),
      pause: () => dispatch({ type: 'PAUSE' }),
      timeupdate: () => dispatch({
        type: 'SET_TIME',
        payload: player.currentTime()
      }),
      durationchange: () => dispatch({
        type: 'SET_DURATION',
        payload: player.duration() || 0
      }),
      volumechange: () => dispatch({
        type: 'SET_VOLUME',
        payload: player.volume()
      }),
      ratechange: () => dispatch({
        type: 'SET_PLAYBACK_RATE',
        payload: player.playbackRate()
      }),
      fullscreenchange: () => dispatch({
        type: 'SET_FULLSCREEN',
        payload: player.isFullscreen()
      }),
      progress: () => {
        const buffered = player.buffered();
        const ranges: Array<{ start: number; end: number }> = [];

        for (let i = 0; i < buffered.length; i++) {
          ranges.push({
            start: buffered.start(i),
            end: buffered.end(i)
          });
        }

        dispatch({ type: 'SET_BUFFERED', payload: ranges });
      },
      error: () => dispatch({
        type: 'SET_ERROR',
        payload: player.error()
      })
    };

    // Attach event listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      player.on(event, handler);
    });

    // Cleanup
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        player.off(event, handler);
      });
    };
  }, [player]);

  return (
    <VideoPlayerContext.Provider value={{ state, dispatch, player, setPlayer }}>
      {children}
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayer = () => {
  const context = useContext(VideoPlayerContext);
  if (!context) {
    throw new Error('useVideoPlayer must be used within VideoPlayerProvider');
  }
  return context;
};
```

### Local Storage Persistence

```typescript
// utils/video-persistence.ts
interface VideoProgress {
  videoId: string;
  currentTime: number;
  duration: number;
  timestamp: number;
}

export class VideoPersistence {
  private storageKey = 'video_progress';
  private maxEntries = 50;

  saveProgress(videoId: string, currentTime: number, duration: number) {
    const progress = this.getAllProgress();

    // Update or add new progress
    const index = progress.findIndex(p => p.videoId === videoId);
    const entry: VideoProgress = {
      videoId,
      currentTime,
      duration,
      timestamp: Date.now()
    };

    if (index >= 0) {
      progress[index] = entry;
    } else {
      progress.push(entry);
    }

    // Limit stored entries
    if (progress.length > this.maxEntries) {
      progress.sort((a, b) => b.timestamp - a.timestamp);
      progress.length = this.maxEntries;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(progress));
  }

  getProgress(videoId: string): VideoProgress | null {
    const progress = this.getAllProgress();
    return progress.find(p => p.videoId === videoId) || null;
  }

  private getAllProgress(): VideoProgress[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  clearProgress(videoId: string) {
    const progress = this.getAllProgress();
    const filtered = progress.filter(p => p.videoId !== videoId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  clearAllProgress() {
    localStorage.removeItem(this.storageKey);
  }
}

// Hook for persistence
export const useVideoProgress = (videoId: string, player: videojs.Player | null) => {
  const persistence = new VideoPersistence();

  useEffect(() => {
    if (!player || !videoId) return;

    // Restore progress on load
    const savedProgress = persistence.getProgress(videoId);
    if (savedProgress && savedProgress.currentTime > 0) {
      player.currentTime(savedProgress.currentTime);
    }

    // Save progress periodically
    const saveInterval = setInterval(() => {
      if (player.currentTime() > 0) {
        persistence.saveProgress(
          videoId,
          player.currentTime(),
          player.duration() || 0
        );
      }
    }, 5000); // Save every 5 seconds

    // Save on pause and ended
    const handlePause = () => {
      persistence.saveProgress(
        videoId,
        player.currentTime(),
        player.duration() || 0
      );
    };

    player.on('pause', handlePause);
    player.on('ended', handlePause);

    return () => {
      clearInterval(saveInterval);
      player.off('pause', handlePause);
      player.off('ended', handlePause);

      // Final save
      persistence.saveProgress(
        videoId,
        player.currentTime(),
        player.duration() || 0
      );
    };
  }, [videoId, player]);
};
```

### Real-time Sync with WebSocket

```typescript
// utils/video-sync.ts
interface SyncMessage {
  type: 'play' | 'pause' | 'seek' | 'rateChange';
  timestamp: number;
  data?: any;
  userId: string;
  sessionId: string;
}

export class VideoSyncManager {
  private ws: WebSocket | null = null;
  private player: videojs.Player;
  private sessionId: string;
  private userId: string;
  private isHost: boolean;
  private syncEnabled: boolean = true;
  private lastSyncTime: number = 0;

  constructor(
    player: videojs.Player,
    wsUrl: string,
    sessionId: string,
    userId: string,
    isHost: boolean = false
  ) {
    this.player = player;
    this.sessionId = sessionId;
    this.userId = userId;
    this.isHost = isHost;

    this.connect(wsUrl);
    this.setupPlayerListeners();
  }

  private connect(wsUrl: string) {
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Sync connection established');
      this.sendMessage({
        type: 'join',
        sessionId: this.sessionId,
        userId: this.userId,
        isHost: this.isHost
      });
    };

    this.ws.onmessage = (event) => {
      const message: SyncMessage = JSON.parse(event.data);
      this.handleSyncMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('Sync connection error:', error);
    };

    this.ws.onclose = () => {
      console.log('Sync connection closed');
      // Implement reconnection logic
    };
  }

  private setupPlayerListeners() {
    if (!this.isHost) return;

    // Only host broadcasts events
    this.player.on('play', () => this.broadcastEvent('play'));
    this.player.on('pause', () => this.broadcastEvent('pause'));

    this.player.on('seeked', () => {
      this.broadcastEvent('seek', {
        currentTime: this.player.currentTime()
      });
    });

    this.player.on('ratechange', () => {
      this.broadcastEvent('rateChange', {
        playbackRate: this.player.playbackRate()
      });
    });
  }

  private broadcastEvent(type: string, data?: any) {
    if (!this.syncEnabled || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    // Throttle sync messages
    const now = Date.now();
    if (now - this.lastSyncTime < 100) return;
    this.lastSyncTime = now;

    this.sendMessage({
      type,
      timestamp: now,
      data,
      userId: this.userId,
      sessionId: this.sessionId
    });
  }

  private handleSyncMessage(message: SyncMessage) {
    // Ignore own messages
    if (message.userId === this.userId) return;

    // Only non-hosts follow sync messages
    if (this.isHost) return;

    // Temporarily disable sync to prevent echo
    this.syncEnabled = false;

    switch (message.type) {
      case 'play':
        this.player.play();
        break;
      case 'pause':
        this.player.pause();
        break;
      case 'seek':
        this.player.currentTime(message.data.currentTime);
        break;
      case 'rateChange':
        this.player.playbackRate(message.data.playbackRate);
        break;
    }

    // Re-enable sync after a delay
    setTimeout(() => {
      this.syncEnabled = true;
    }, 500);
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

## Best Practices

### Performance Optimization

1. **Lazy Load Video.js**: Only load the library when needed
2. **Tree Shaking**: Import only required plugins
3. **Code Splitting**: Separate video player bundle
4. **Preload Strategies**: Use appropriate preload values
5. **Memory Management**: Properly dispose players

### Accessibility

1. **Keyboard Navigation**: Ensure all controls are keyboard accessible
2. **Screen Reader Support**: Provide proper ARIA labels
3. **Captions/Subtitles**: Always include text tracks
4. **Focus Management**: Proper focus handling in fullscreen
5. **High Contrast Mode**: Support for visual accessibility

### Testing Considerations

1. **Mock Video.js in Tests**: Create proper mocks for unit tests
2. **E2E Testing**: Use real video files for integration tests
3. **Performance Testing**: Monitor memory leaks and CPU usage
4. **Cross-browser Testing**: Test on all major browsers
5. **Device Testing**: Ensure mobile/tablet compatibility

## Troubleshooting

### Common Issues

1. **SSR Errors**: Always check for `window` object
2. **Plugin Conflicts**: Load plugins in correct order
3. **Memory Leaks**: Ensure proper cleanup in `useEffect`
4. **CORS Issues**: Configure proper headers for video sources
5. **Mobile Autoplay**: Handle browser autoplay policies

### Debug Tools

```typescript
// Enable Video.js debug mode
if (process.env.NODE_ENV === 'development') {
  videojs.log.level('debug');
}

// Custom debug overlay
player.ready(() => {
  const debugOverlay = player.addChild('Component', {
    className: 'vjs-debug-overlay'
  });

  player.on('timeupdate', () => {
    debugOverlay.el().innerHTML = `
      Time: ${player.currentTime().toFixed(2)}s
      Buffer: ${player.bufferedPercent().toFixed(2)}%
      Rate: ${player.playbackRate()}x
    `;
  });
});
```

## Resources

- [Video.js Documentation](https://docs.videojs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Video.js Plugins](https://videojs.com/plugins/)
- [Video.js GitHub](https://github.com/videojs/video.js)