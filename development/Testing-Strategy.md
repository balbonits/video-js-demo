# Testing Strategy for Video Player

## Overview

This document outlines the comprehensive testing strategy for our Video.js-based video player application, covering unit testing, integration testing, end-to-end testing, and performance testing approaches.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [E2E Testing with Playwright](#e2e-testing-with-playwright)
6. [Performance Testing](#performance-testing)
7. [Cross-Browser Testing](#cross-browser-testing)
8. [Device Testing](#device-testing)
9. [Test Data Management](#test-data-management)
10. [CI/CD Integration](#cicd-integration)

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Isolation**: Each test should be independent and repeatable
3. **Fast Feedback**: Prioritize fast-running tests in development
4. **Comprehensive Coverage**: Aim for >80% code coverage
5. **Real-World Scenarios**: Test actual user workflows

### Testing Pyramid

```
         ┌─────────────┐
         │     E2E     │  (10%)
         ├─────────────┤
         │ Integration │  (30%)
         ├─────────────┤
         │    Unit     │  (60%)
         └─────────────┘
```

## Unit Testing

### Setup and Configuration

#### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^video\\.js$': '<rootDir>/tests/mocks/videojs.mock.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
  ],
};
```

#### Test Setup File

```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock HTMLMediaElement methods
HTMLMediaElement.prototype.play = jest.fn(() => Promise.resolve());
HTMLMediaElement.prototype.pause = jest.fn();
HTMLMediaElement.prototype.load = jest.fn();
```

### Video.js Mock

```typescript
// tests/mocks/videojs.mock.ts
import { EventEmitter } from 'events';

class MockPlayer extends EventEmitter {
  private _currentTime: number = 0;
  private _duration: number = 100;
  private _paused: boolean = true;
  private _volume: number = 1;
  private _playbackRate: number = 1;
  private _isFullscreen: boolean = false;
  private _disposed: boolean = false;
  private _error: any = null;

  constructor(public el: HTMLElement, public options: any) {
    super();
    setTimeout(() => this.emit('ready'), 0);
  }

  play() {
    this._paused = false;
    this.emit('play');
    return Promise.resolve();
  }

  pause() {
    this._paused = true;
    this.emit('pause');
  }

  paused() {
    return this._paused;
  }

  currentTime(seconds?: number): number | void {
    if (seconds !== undefined) {
      this._currentTime = seconds;
      this.emit('timeupdate');
    } else {
      return this._currentTime;
    }
  }

  duration(): number {
    return this._duration;
  }

  volume(level?: number): number | void {
    if (level !== undefined) {
      this._volume = level;
      this.emit('volumechange');
    } else {
      return this._volume;
    }
  }

  playbackRate(rate?: number): number | void {
    if (rate !== undefined) {
      this._playbackRate = rate;
      this.emit('ratechange');
    } else {
      return this._playbackRate;
    }
  }

  isFullscreen(value?: boolean): boolean | void {
    if (value !== undefined) {
      this._isFullscreen = value;
      this.emit('fullscreenchange');
    } else {
      return this._isFullscreen;
    }
  }

  src(source?: any): string | void {
    if (source) {
      this.emit('loadstart');
      setTimeout(() => {
        this.emit('loadedmetadata');
        this.emit('loadeddata');
        this.emit('canplay');
        this.emit('canplaythrough');
      }, 10);
    }
    return 'https://example.com/video.mp4';
  }

  error(err?: any): any {
    if (err) {
      this._error = err;
      this.emit('error');
    }
    return this._error;
  }

  ready(callback: Function) {
    if (callback) {
      this.on('ready', callback);
    }
  }

  dispose() {
    this._disposed = true;
    this.removeAllListeners();
  }

  isDisposed() {
    return this._disposed;
  }

  buffered() {
    return {
      length: 1,
      start: (index: number) => 0,
      end: (index: number) => this._currentTime + 10,
    };
  }

  bufferedPercent() {
    return 0.5;
  }

  // Plugin methods
  qualityLevels() {
    return {
      levels_: [],
      on: jest.fn(),
      off: jest.fn(),
    };
  }
}

const videojs = jest.fn((el: HTMLElement, options: any, ready?: Function) => {
  const player = new MockPlayer(el, options);
  if (ready) {
    player.ready(ready);
  }
  return player;
});

videojs.getPlayers = jest.fn(() => ({}));
videojs.getAllPlayers = jest.fn(() => []);
videojs.getPlayer = jest.fn();
videojs.log = {
  level: jest.fn(),
  history: jest.fn(() => []),
};
videojs.getComponent = jest.fn();
videojs.registerComponent = jest.fn();
videojs.registerPlugin = jest.fn();
videojs.getPlugin = jest.fn(() => class {});

export default videojs;
export { MockPlayer };
```

### Unit Test Examples

#### Testing Video Player Component

```typescript
// tests/unit/VideoPlayer.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoPlayer } from '@/components/VideoPlayer';
import videojs from 'video.js';

jest.mock('video.js');

describe('VideoPlayer Component', () => {
  const defaultProps = {
    options: {
      sources: [{
        src: 'https://example.com/video.mp4',
        type: 'video/mp4',
      }],
      poster: 'https://example.com/poster.jpg',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize Video.js player on mount', async () => {
    render(<VideoPlayer {...defaultProps} />);

    await waitFor(() => {
      expect(videojs).toHaveBeenCalledTimes(1);
    });

    expect(videojs).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        sources: defaultProps.options.sources,
        poster: defaultProps.options.poster,
      }),
      expect.any(Function)
    );
  });

  it('should dispose player on unmount', async () => {
    const { unmount } = render(<VideoPlayer {...defaultProps} />);

    const playerInstance = (videojs as jest.Mock).mock.results[0].value;
    const disposeSpy = jest.spyOn(playerInstance, 'dispose');

    unmount();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle onReady callback', async () => {
    const onReady = jest.fn();

    render(<VideoPlayer {...defaultProps} onReady={onReady} />);

    await waitFor(() => {
      expect(onReady).toHaveBeenCalledTimes(1);
    });

    expect(onReady).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should handle error events', async () => {
    const onError = jest.fn();

    render(<VideoPlayer {...defaultProps} onError={onError} />);

    const playerInstance = (videojs as jest.Mock).mock.results[0].value;

    const mockError = {
      code: 4,
      message: 'Source not supported',
    };

    playerInstance.error(mockError);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(mockError);
    });
  });

  it('should update source when props change', async () => {
    const { rerender } = render(<VideoPlayer {...defaultProps} />);

    const playerInstance = (videojs as jest.Mock).mock.results[0].value;
    const srcSpy = jest.spyOn(playerInstance, 'src');

    const newSource = [{
      src: 'https://example.com/new-video.mp4',
      type: 'video/mp4',
    }];

    rerender(<VideoPlayer options={{ sources: newSource }} />);

    await waitFor(() => {
      expect(srcSpy).toHaveBeenCalledWith(newSource);
    });
  });
});
```

#### Testing Custom Hooks

```typescript
// tests/unit/useVideoPlayer.test.ts
import { renderHook, act } from '@testing-library/react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import videojs from 'video.js';

jest.mock('video.js');

describe('useVideoPlayer Hook', () => {
  const mockVideoElement = document.createElement('video');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize player and return controls', () => {
    const { result } = renderHook(() => useVideoPlayer({
      sources: [{ src: 'test.mp4', type: 'video/mp4' }],
    }));

    expect(result.current.isReady).toBe(false);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.duration).toBe(0);
  });

  it('should handle play action', async () => {
    const { result } = renderHook(() => useVideoPlayer({
      sources: [{ src: 'test.mp4', type: 'video/mp4' }],
    }));

    const playerInstance = (videojs as jest.Mock).mock.results[0].value;

    act(() => {
      result.current.play();
    });

    expect(playerInstance.play).toHaveBeenCalledTimes(1);
  });

  it('should handle pause action', () => {
    const { result } = renderHook(() => useVideoPlayer({
      sources: [{ src: 'test.mp4', type: 'video/mp4' }],
    }));

    const playerInstance = (videojs as jest.Mock).mock.results[0].value;

    act(() => {
      result.current.pause();
    });

    expect(playerInstance.pause).toHaveBeenCalledTimes(1);
  });

  it('should handle seek action', () => {
    const { result } = renderHook(() => useVideoPlayer({
      sources: [{ src: 'test.mp4', type: 'video/mp4' }],
    }));

    const playerInstance = (videojs as jest.Mock).mock.results[0].value;

    act(() => {
      result.current.seek(30);
    });

    expect(playerInstance.currentTime).toHaveBeenCalledWith(30);
  });

  it('should update state on player events', () => {
    const { result } = renderHook(() => useVideoPlayer({
      sources: [{ src: 'test.mp4', type: 'video/mp4' }],
    }));

    const playerInstance = (videojs as jest.Mock).mock.results[0].value;

    act(() => {
      playerInstance.emit('play');
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      playerInstance.emit('pause');
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => useVideoPlayer({
      sources: [{ src: 'test.mp4', type: 'video/mp4' }],
    }));

    const playerInstance = (videojs as jest.Mock).mock.results[0].value;
    const disposeSpy = jest.spyOn(playerInstance, 'dispose');

    unmount();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});
```

## Integration Testing

### Testing Video Player with API

```typescript
// tests/integration/VideoPlayerIntegration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { VideoPlayerWithData } from '@/components/VideoPlayerWithData';
import { server } from '@/tests/mocks/server';
import { rest } from 'msw';

describe('VideoPlayer Integration Tests', () => {
  it('should load video metadata from API', async () => {
    server.use(
      rest.get('/api/videos/:id', (req, res, ctx) => {
        return res(
          ctx.json({
            id: req.params.id,
            title: 'Test Video',
            sources: [{
              src: 'https://example.com/video.mp4',
              type: 'video/mp4',
            }],
            poster: 'https://example.com/poster.jpg',
            duration: 120,
          })
        );
      })
    );

    render(<VideoPlayerWithData videoId="test-123" />);

    await waitFor(() => {
      expect(screen.getByTestId('video-player')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      rest.get('/api/videos/:id', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ error: 'Video not found' }));
      })
    );

    render(<VideoPlayerWithData videoId="invalid-id" />);

    await waitFor(() => {
      expect(screen.getByText(/Video not found/i)).toBeInTheDocument();
    });

    expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
  });

  it('should track analytics events', async () => {
    const analyticsSpy = jest.fn();

    server.use(
      rest.post('/api/analytics', async (req, res, ctx) => {
        const body = await req.json();
        analyticsSpy(body);
        return res(ctx.json({ success: true }));
      })
    );

    render(<VideoPlayerWithData videoId="test-123" enableAnalytics />);

    const player = await waitFor(() => screen.getByTestId('video-player'));

    // Simulate play event
    fireEvent.play(player);

    await waitFor(() => {
      expect(analyticsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'play',
          videoId: 'test-123',
        })
      );
    });
  });
});
```

## E2E Testing with Playwright

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

#### Video Playback Test

```typescript
// tests/e2e/video-playback.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Video Playback', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/video/test-video');
    await page.waitForSelector('.video-js');
  });

  test('should load and play video', async ({ page }) => {
    // Wait for video to be ready
    await page.waitForFunction(() => {
      const video = document.querySelector('video');
      return video && video.readyState >= 2; // HAVE_CURRENT_DATA
    });

    // Click play button
    await page.click('.vjs-play-control');

    // Verify video is playing
    await expect(page.locator('video')).toHaveJSProperty('paused', false);

    // Wait for some playback
    await page.waitForTimeout(2000);

    // Verify current time has advanced
    const currentTime = await page.locator('video').evaluate(
      (el: HTMLVideoElement) => el.currentTime
    );
    expect(currentTime).toBeGreaterThan(0);
  });

  test('should pause and resume video', async ({ page }) => {
    // Play video
    await page.click('.vjs-play-control');
    await page.waitForTimeout(1000);

    // Pause video
    await page.click('.vjs-play-control');
    await expect(page.locator('video')).toHaveJSProperty('paused', true);

    const pausedTime = await page.locator('video').evaluate(
      (el: HTMLVideoElement) => el.currentTime
    );

    await page.waitForTimeout(1000);

    // Verify time hasn't changed while paused
    const stillPausedTime = await page.locator('video').evaluate(
      (el: HTMLVideoElement) => el.currentTime
    );
    expect(stillPausedTime).toBe(pausedTime);

    // Resume playback
    await page.click('.vjs-play-control');
    await expect(page.locator('video')).toHaveJSProperty('paused', false);
  });

  test('should seek to different positions', async ({ page }) => {
    // Wait for video metadata
    await page.waitForFunction(() => {
      const video = document.querySelector('video');
      return video && video.duration > 0;
    });

    // Click on progress bar at 50%
    const progressBar = page.locator('.vjs-progress-control');
    const box = await progressBar.boundingBox();

    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

      // Verify seek
      const currentTime = await page.locator('video').evaluate(
        (el: HTMLVideoElement) => el.currentTime
      );
      const duration = await page.locator('video').evaluate(
        (el: HTMLVideoElement) => el.duration
      );

      expect(currentTime).toBeGreaterThan(duration * 0.4);
      expect(currentTime).toBeLessThan(duration * 0.6);
    }
  });

  test('should adjust volume', async ({ page }) => {
    // Hover over volume control to show slider
    await page.hover('.vjs-volume-panel');

    // Adjust volume
    const volumeBar = page.locator('.vjs-volume-bar');
    const box = await volumeBar.boundingBox();

    if (box) {
      // Set to 50% volume
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

      const volume = await page.locator('video').evaluate(
        (el: HTMLVideoElement) => el.volume
      );
      expect(volume).toBeCloseTo(0.5, 1);
    }
  });

  test('should enter and exit fullscreen', async ({ page, browserName }) => {
    // Skip on webkit due to fullscreen API differences
    test.skip(browserName === 'webkit', 'Fullscreen API differs in WebKit');

    // Enter fullscreen
    await page.click('.vjs-fullscreen-control');

    // Check if fullscreen class is added
    await expect(page.locator('.video-js')).toHaveClass(/vjs-fullscreen/);

    // Exit fullscreen
    await page.keyboard.press('Escape');

    // Verify exit from fullscreen
    await expect(page.locator('.video-js')).not.toHaveClass(/vjs-fullscreen/);
  });

  test('should display error for invalid source', async ({ page }) => {
    await page.goto('/video/invalid-source');

    // Wait for error display
    await page.waitForSelector('.vjs-error-display', { state: 'visible' });

    // Verify error message
    await expect(page.locator('.vjs-error-display')).toContainText(
      /The media could not be loaded/i
    );
  });
});
```

#### Quality Switching Test

```typescript
// tests/e2e/quality-switching.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Quality Switching', () => {
  test('should switch between quality levels', async ({ page }) => {
    await page.goto('/video/hls-stream');

    // Wait for quality selector to be available
    await page.waitForSelector('.vjs-quality-selector', { timeout: 10000 });

    // Open quality menu
    await page.click('.vjs-quality-selector');

    // Get available quality options
    const qualities = await page.locator('.vjs-menu-item').allTextContents();
    expect(qualities.length).toBeGreaterThan(1);

    // Select a different quality
    await page.click('.vjs-menu-item:nth-child(2)');

    // Verify quality changed
    await expect(page.locator('.vjs-quality-selector')).toContainText(
      qualities[1]
    );

    // Wait for buffer to adjust
    await page.waitForTimeout(2000);

    // Verify playback continues
    await page.click('.vjs-play-control');
    await expect(page.locator('video')).toHaveJSProperty('paused', false);
  });
});
```

## Performance Testing

### Performance Test Setup

```typescript
// tests/performance/video-performance.test.ts
import { chromium, Browser, Page } from 'playwright';

describe('Video Player Performance', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    const context = await browser.newContext();
    page = await context.newPage();

    // Enable performance metrics
    await page.addInitScript(() => {
      window.performanceMetrics = {
        startTime: Date.now(),
        events: [],
        memory: [],
      };

      // Track video events
      document.addEventListener('DOMContentLoaded', () => {
        const video = document.querySelector('video');
        if (video) {
          ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing'].forEach(event => {
            video.addEventListener(event, () => {
              window.performanceMetrics.events.push({
                type: event,
                timestamp: Date.now() - window.performanceMetrics.startTime,
              });
            });
          });
        }
      });

      // Track memory usage
      if (performance.memory) {
        setInterval(() => {
          window.performanceMetrics.memory.push({
            timestamp: Date.now() - window.performanceMetrics.startTime,
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
          });
        }, 1000);
      }
    });
  });

  test('should load video within acceptable time', async () => {
    await page.goto('/video/test-video');

    // Wait for video to be ready to play
    await page.waitForFunction(() => {
      const video = document.querySelector('video');
      return video && video.readyState >= 3; // HAVE_FUTURE_DATA
    }, { timeout: 10000 });

    const metrics = await page.evaluate(() => window.performanceMetrics);

    // Find time to canplay event
    const canplayEvent = metrics.events.find(e => e.type === 'canplay');
    expect(canplayEvent).toBeDefined();
    expect(canplayEvent.timestamp).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('should not have memory leaks during playback', async () => {
    await page.goto('/video/test-video');

    // Play video for 30 seconds
    await page.click('.vjs-play-control');
    await page.waitForTimeout(30000);

    const metrics = await page.evaluate(() => window.performanceMetrics);

    // Analyze memory usage
    const memoryData = metrics.memory;
    const initialMemory = memoryData[0]?.usedJSHeapSize || 0;
    const finalMemory = memoryData[memoryData.length - 1]?.usedJSHeapSize || 0;

    // Memory should not increase by more than 50MB
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
    expect(memoryIncrease).toBeLessThan(50);
  });

  test('should maintain smooth playback', async () => {
    await page.goto('/video/test-video');

    // Monitor frame drops
    await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      window.frameMetrics = {
        droppedFrames: 0,
        totalFrames: 0,
      };

      if (video && video.getVideoPlaybackQuality) {
        setInterval(() => {
          const quality = video.getVideoPlaybackQuality();
          window.frameMetrics.droppedFrames = quality.droppedVideoFrames;
          window.frameMetrics.totalFrames = quality.totalVideoFrames;
        }, 1000);
      }
    });

    // Play video for 10 seconds
    await page.click('.vjs-play-control');
    await page.waitForTimeout(10000);

    const frameMetrics = await page.evaluate(() => window.frameMetrics);

    // Frame drop rate should be less than 1%
    const dropRate = frameMetrics.droppedFrames / frameMetrics.totalFrames;
    expect(dropRate).toBeLessThan(0.01);
  });
});
```

### Load Testing

```typescript
// tests/performance/load-test.ts
import { check } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'],              // Error rate under 10%
  },
};

export default function () {
  // Test video page load
  const pageResponse = http.get('http://localhost:3000/video/test-video');
  check(pageResponse, {
    'page loaded successfully': (r) => r.status === 200,
    'page load time < 1s': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  // Test video manifest load
  const manifestResponse = http.get('http://localhost:3000/api/video/test-video/manifest.m3u8');
  check(manifestResponse, {
    'manifest loaded successfully': (r) => r.status === 200,
    'manifest load time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  // Test video segment load
  const segmentResponse = http.get('http://localhost:3000/api/video/test-video/segment-1.ts');
  check(segmentResponse, {
    'segment loaded successfully': (r) => r.status === 200,
    'segment load time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  // Simulate think time
  sleep(Math.random() * 3 + 2);
}
```

## Cross-Browser Testing

### Browser Compatibility Matrix

| Feature | Chrome | Firefox | Safari | Edge | Mobile Chrome | Mobile Safari |
|---------|--------|---------|--------|------|---------------|---------------|
| Basic Playback | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| HLS Streaming | ✅ | ✅* | ✅ | ✅ | ✅ | ✅ |
| DASH Streaming | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Picture-in-Picture | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fullscreen | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Keyboard Controls | ✅ | ✅ | ✅ | ✅ | N/A | N/A |
| Subtitles/CC | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

*With Media Source Extensions

### Cross-Browser Test Suite

```typescript
// tests/e2e/cross-browser.spec.ts
import { test, expect, devices } from '@playwright/test';

const browsers = [
  { name: 'Chrome', device: devices['Desktop Chrome'] },
  { name: 'Firefox', device: devices['Desktop Firefox'] },
  { name: 'Safari', device: devices['Desktop Safari'] },
  { name: 'Edge', device: devices['Desktop Edge'] },
];

browsers.forEach(({ name, device }) => {
  test.describe(`${name} Compatibility`, () => {
    test.use(device);

    test('should support basic video playback', async ({ page }) => {
      await page.goto('/video/test-video');

      const video = page.locator('video');
      await expect(video).toBeVisible();

      // Test play functionality
      await page.click('.vjs-play-control');
      await expect(video).toHaveJSProperty('paused', false);
    });

    test('should handle fullscreen mode', async ({ page, browserName }) => {
      // Skip Safari mobile due to fullscreen limitations
      test.skip(
        browserName === 'webkit' && device.isMobile,
        'Fullscreen limited on mobile Safari'
      );

      await page.goto('/video/test-video');
      await page.click('.vjs-fullscreen-control');

      await expect(page.locator('.video-js')).toHaveClass(/vjs-fullscreen/);
    });

    test('should support keyboard navigation', async ({ page }) => {
      test.skip(device.isMobile, 'No keyboard on mobile');

      await page.goto('/video/test-video');
      await page.locator('.video-js').focus();

      // Space to play/pause
      await page.keyboard.press('Space');
      await expect(page.locator('video')).toHaveJSProperty('paused', false);

      await page.keyboard.press('Space');
      await expect(page.locator('video')).toHaveJSProperty('paused', true);

      // Arrow keys for seeking
      await page.keyboard.press('ArrowRight');
      const currentTime = await page.locator('video').evaluate(
        (el: HTMLVideoElement) => el.currentTime
      );
      expect(currentTime).toBeGreaterThan(0);
    });
  });
});
```

## Device Testing

### Mobile Testing Strategy

```typescript
// tests/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

const mobileDevices = [
  devices['iPhone 12'],
  devices['iPhone 12 Pro Max'],
  devices['iPhone SE'],
  devices['Pixel 5'],
  devices['Galaxy S21'],
  devices['iPad Pro'],
  devices['iPad Mini'],
];

mobileDevices.forEach((device) => {
  test.describe(`Mobile: ${device.name}`, () => {
    test.use(device);

    test('should adapt to viewport size', async ({ page }) => {
      await page.goto('/video/test-video');

      const videoContainer = page.locator('.video-js');
      const bbox = await videoContainer.boundingBox();

      // Video should fit within viewport
      expect(bbox?.width).toBeLessThanOrEqual(device.viewport.width);
      expect(bbox?.height).toBeLessThanOrEqual(device.viewport.height);
    });

    test('should show mobile-optimized controls', async ({ page }) => {
      await page.goto('/video/test-video');

      // Mobile should have larger touch targets
      const playButton = page.locator('.vjs-play-control');
      const bbox = await playButton.boundingBox();

      // Minimum touch target size (44x44 for iOS, 48x48 for Android)
      const minSize = device.name?.includes('iPhone') ? 44 : 48;
      expect(bbox?.width).toBeGreaterThanOrEqual(minSize);
      expect(bbox?.height).toBeGreaterThanOrEqual(minSize);
    });

    test('should handle orientation changes', async ({ page, context }) => {
      // Skip if device doesn't support orientation
      if (!device.viewport) return;

      await page.goto('/video/test-video');

      // Switch to landscape
      await context.setViewportSize({
        width: device.viewport.height,
        height: device.viewport.width,
      });

      await page.waitForTimeout(500); // Wait for resize

      // Verify video resized appropriately
      const videoContainer = page.locator('.video-js');
      const bbox = await videoContainer.boundingBox();

      expect(bbox?.width).toBeGreaterThan(bbox?.height || 0);
    });

    test('should handle touch gestures', async ({ page }) => {
      await page.goto('/video/test-video');

      const video = page.locator('.video-js');

      // Double tap to toggle play/pause
      await video.dblclick();
      await expect(page.locator('video')).toHaveJSProperty('paused', false);

      await video.dblclick();
      await expect(page.locator('video')).toHaveJSProperty('paused', true);
    });
  });
});
```

### Network Condition Testing

```typescript
// tests/e2e/network-conditions.spec.ts
import { test, expect } from '@playwright/test';

const networkConditions = [
  { name: '3G Slow', downloadThroughput: 400, uploadThroughput: 100, latency: 400 },
  { name: '3G Fast', downloadThroughput: 1600, uploadThroughput: 768, latency: 150 },
  { name: '4G', downloadThroughput: 4000, uploadThroughput: 3000, latency: 50 },
  { name: 'WiFi', downloadThroughput: 30000, uploadThroughput: 15000, latency: 10 },
];

networkConditions.forEach((condition) => {
  test.describe(`Network: ${condition.name}`, () => {
    test('should adapt quality based on network', async ({ page, context }) => {
      // Emulate network conditions
      await context.route('**/*', (route) => route.continue(), {
        throttle: {
          downloadThroughput: condition.downloadThroughput * 1024 / 8,
          uploadThroughput: condition.uploadThroughput * 1024 / 8,
          latency: condition.latency,
        },
      });

      await page.goto('/video/adaptive-stream');

      // Wait for quality adaptation
      await page.waitForTimeout(5000);

      // Check selected quality level
      const quality = await page.locator('.vjs-quality-selector').textContent();

      if (condition.name === '3G Slow') {
        expect(quality).toContain('360p');
      } else if (condition.name === '4G' || condition.name === 'WiFi') {
        expect(['720p', '1080p']).toContain(quality || '');
      }
    });

    test('should buffer appropriately', async ({ page, context }) => {
      await context.route('**/*', (route) => route.continue(), {
        throttle: {
          downloadThroughput: condition.downloadThroughput * 1024 / 8,
          uploadThroughput: condition.uploadThroughput * 1024 / 8,
          latency: condition.latency,
        },
      });

      await page.goto('/video/test-video');
      await page.click('.vjs-play-control');

      // Monitor buffering events
      const bufferingEvents = await page.evaluate(() => {
        return new Promise((resolve) => {
          const events: any[] = [];
          const video = document.querySelector('video');

          if (video) {
            let bufferStartTime: number | null = null;

            video.addEventListener('waiting', () => {
              bufferStartTime = Date.now();
              events.push({ type: 'buffer_start', timestamp: bufferStartTime });
            });

            video.addEventListener('playing', () => {
              if (bufferStartTime) {
                const duration = Date.now() - bufferStartTime;
                events.push({ type: 'buffer_end', duration });
                bufferStartTime = null;
              }
            });

            setTimeout(() => resolve(events), 10000);
          }
        });
      });

      // Slower connections should have more buffering events
      if (condition.name === '3G Slow') {
        expect(bufferingEvents.length).toBeGreaterThan(0);
      }
    });
  });
});
```

## Test Data Management

### Test Video Generation

```typescript
// scripts/generate-test-videos.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface TestVideoConfig {
  name: string;
  duration: number; // seconds
  resolution: string;
  bitrate: string;
  format: 'mp4' | 'webm' | 'hls';
}

const testVideos: TestVideoConfig[] = [
  { name: 'short-360p', duration: 30, resolution: '640x360', bitrate: '500k', format: 'mp4' },
  { name: 'medium-720p', duration: 120, resolution: '1280x720', bitrate: '2000k', format: 'mp4' },
  { name: 'long-1080p', duration: 600, resolution: '1920x1080', bitrate: '5000k', format: 'mp4' },
  { name: 'hls-stream', duration: 120, resolution: '1280x720', bitrate: '2000k', format: 'hls' },
  { name: 'webm-vp9', duration: 60, resolution: '1280x720', bitrate: '1500k', format: 'webm' },
];

async function generateTestVideo(config: TestVideoConfig) {
  const outputDir = path.join(__dirname, '../public/test-videos');
  await fs.mkdir(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, `${config.name}.${config.format === 'hls' ? 'm3u8' : config.format}`);

  // Generate synthetic video with FFmpeg
  let command = `ffmpeg -f lavfi -i testsrc2=size=${config.resolution}:duration=${config.duration}:rate=30 `;
  command += `-f lavfi -i sine=frequency=1000:duration=${config.duration} `;

  if (config.format === 'mp4') {
    command += `-c:v libx264 -b:v ${config.bitrate} -c:a aac -b:a 128k `;
    command += `-preset fast -movflags +faststart ${outputFile}`;
  } else if (config.format === 'webm') {
    command += `-c:v libvpx-vp9 -b:v ${config.bitrate} -c:a libopus -b:a 128k `;
    command += `${outputFile}`;
  } else if (config.format === 'hls') {
    command += `-c:v libx264 -b:v ${config.bitrate} -c:a aac -b:a 128k `;
    command += `-hls_time 10 -hls_list_size 0 -f hls ${outputFile}`;
  }

  console.log(`Generating ${config.name}...`);
  await execAsync(command);
  console.log(`Generated ${config.name}`);

  // Generate poster image
  const posterFile = path.join(outputDir, `${config.name}-poster.jpg`);
  await execAsync(`ffmpeg -i ${outputFile} -ss 00:00:05 -vframes 1 ${posterFile}`);
}

async function generateAllTestVideos() {
  for (const config of testVideos) {
    await generateTestVideo(config);
  }

  // Generate metadata file
  const metadata = testVideos.map(config => ({
    id: config.name,
    title: config.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    duration: config.duration,
    resolution: config.resolution,
    format: config.format,
    src: `/test-videos/${config.name}.${config.format === 'hls' ? 'm3u8' : config.format}`,
    poster: `/test-videos/${config.name}-poster.jpg`,
  }));

  await fs.writeFile(
    path.join(__dirname, '../public/test-videos/metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  console.log('All test videos generated successfully');
}

generateAllTestVideos().catch(console.error);
```

### Mock Data Fixtures

```typescript
// tests/fixtures/video-fixtures.ts
export const videoFixtures = {
  validVideo: {
    id: 'test-video-1',
    title: 'Sample Video',
    description: 'This is a test video for automated testing',
    duration: 120,
    sources: [
      { src: '/test-videos/medium-720p.mp4', type: 'video/mp4', quality: '720p' },
      { src: '/test-videos/medium-720p.webm', type: 'video/webm', quality: '720p' },
    ],
    poster: '/test-videos/medium-720p-poster.jpg',
    subtitles: [
      { src: '/subtitles/en.vtt', srclang: 'en', label: 'English' },
      { src: '/subtitles/es.vtt', srclang: 'es', label: 'Spanish' },
    ],
  },

  hlsVideo: {
    id: 'hls-test-1',
    title: 'HLS Stream Test',
    duration: 300,
    sources: [
      { src: '/test-videos/hls-stream.m3u8', type: 'application/x-mpegURL' },
    ],
    poster: '/test-videos/hls-stream-poster.jpg',
  },

  brokenVideo: {
    id: 'broken-video-1',
    title: 'Broken Video',
    sources: [
      { src: 'https://example.com/non-existent.mp4', type: 'video/mp4' },
    ],
  },

  slowLoadingVideo: {
    id: 'slow-video-1',
    title: 'Slow Loading Video',
    sources: [
      { src: '/api/slow-video?delay=5000', type: 'video/mp4' },
    ],
  },
};

export const analyticsEvents = {
  play: {
    event: 'play',
    videoId: 'test-video-1',
    timestamp: Date.now(),
    currentTime: 0,
  },

  pause: {
    event: 'pause',
    videoId: 'test-video-1',
    timestamp: Date.now(),
    currentTime: 30,
  },

  ended: {
    event: 'ended',
    videoId: 'test-video-1',
    timestamp: Date.now(),
    watchTime: 120,
    completionRate: 100,
  },

  error: {
    event: 'error',
    videoId: 'broken-video-1',
    timestamp: Date.now(),
    errorCode: 4,
    errorMessage: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
  },
};
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E tests
        run: npm run e2e -- --project=${{ matrix.browser }}

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}
          path: |
            playwright-report/
            test-results/

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run performance tests
        run: npm run test:performance

      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results/
```

## Testing Best Practices

### Do's

1. **Write tests first**: Follow TDD when possible
2. **Test user behavior**: Focus on what users do, not implementation
3. **Keep tests simple**: Each test should verify one thing
4. **Use meaningful names**: Test names should describe what they verify
5. **Clean up after tests**: Always dispose of resources
6. **Mock external dependencies**: Don't rely on external services
7. **Test edge cases**: Include error scenarios and boundary conditions

### Don'ts

1. **Don't test Video.js internals**: Trust the library's own tests
2. **Don't use hard-coded waits**: Use proper wait conditions
3. **Don't share state between tests**: Each test should be independent
4. **Don't ignore flaky tests**: Fix them or remove them
5. **Don't test styling**: Leave visual testing to manual QA or visual regression tools

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Video.js Testing Guide](https://github.com/videojs/video.js/blob/main/docs/guides/testing.md)
- [Web Performance Testing](https://developer.chrome.com/docs/lighthouse/performance/)