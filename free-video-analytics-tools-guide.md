# Free Analytics, Monitoring & Testing Tools for Video Streaming

> A comprehensive guide to zero-budget analytics solutions for video streaming applications

## Table of Contents
1. [Performance Monitoring](#1-performance-monitoring)
2. [Analytics Platforms](#2-analytics-platforms)
3. [A/B Testing & Feature Flags](#3-ab-testing--feature-flags)
4. [Error Tracking](#4-error-tracking)
5. [Video-Specific Analytics](#5-video-specific-analytics)
6. [Debugging Tools](#6-debugging-tools)
7. [Synthetic Monitoring](#7-synthetic-monitoring)
8. [User Behavior Analytics](#8-user-behavior-analytics)
9. [Integration Examples](#9-integration-examples)
10. [Best Practices](#10-best-practices)

---

## 1. Performance Monitoring

### Google Lighthouse
**Purpose:** Core Web Vitals, performance scoring, accessibility
**Free Tier:** Completely free
**Integration:** CLI, Chrome DevTools, CI/CD pipelines

```javascript
// Programmatic usage with Lighthouse
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  return runnerResult.lhr;
}
```

**Limitations:** No real-time monitoring, requires manual runs

### Chrome DevTools Performance API
**Purpose:** Real User Monitoring (RUM), video performance metrics
**Free Tier:** Completely free
**Integration:** Browser JavaScript

```javascript
// Capture video performance metrics
class VideoPerformanceMonitor {
  constructor(videoElement) {
    this.video = videoElement;
    this.metrics = {};
  }

  collectMetrics() {
    // Navigation Timing API
    const perfData = performance.getEntriesByType('navigation')[0];

    // Video-specific metrics
    this.metrics = {
      // Page load metrics
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
      loadComplete: perfData.loadEventEnd - perfData.loadEventStart,

      // Video metrics
      videoLoadTime: this.video.readyState >= 3 ? performance.now() : null,
      bufferHealth: this.video.buffered.length > 0 ?
        this.video.buffered.end(0) - this.video.currentTime : 0,
      droppedFrames: this.video.getVideoPlaybackQuality ?
        this.video.getVideoPlaybackQuality().droppedVideoFrames : 0,

      // Network metrics
      connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
      downlink: navigator.connection ? navigator.connection.downlink : null
    };

    return this.metrics;
  }

  sendToAnalytics() {
    // Send to your free analytics platform
    if (window.gtag) {
      gtag('event', 'video_performance', {
        event_category: 'video',
        event_label: 'performance_metrics',
        value: JSON.stringify(this.metrics)
      });
    }
  }
}
```

### WebPageTest
**Purpose:** Detailed performance analysis, video rendering
**Free Tier:** Free online tool, 200 tests/day for API
**API Integration:**

```javascript
const WebPageTest = require('webpagetest');
const wpt = new WebPageTest('www.webpagetest.org', 'YOUR_API_KEY');

wpt.runTest('https://your-video-site.com', {
  location: 'Dulles:Chrome',
  connectivity: '4G',
  video: true,
  timeline: true
}, (err, data) => {
  if (data) {
    console.log('Test ID:', data.data.testId);
    console.log('View results:', data.data.summary);
  }
});
```

### GTmetrix
**Purpose:** Page speed analysis, video impact on performance
**Free Tier:** 5 URLs monitored daily
**Limitations:** Limited API calls, no custom locations in free tier

### SpeedCurve
**Purpose:** Continuous performance monitoring
**Free Tier:** 30-day free trial
**Best For:** Initial performance baseline establishment

---

## 2. Analytics Platforms

### Google Analytics 4 (GA4)
**Purpose:** Comprehensive web analytics
**Free Tier:** Up to 10M events/month
**Video Event Tracking:**

```javascript
// GA4 Video Analytics Implementation
class GA4VideoTracker {
  constructor(videoElement) {
    this.video = videoElement;
    this.sessionData = {
      startTime: null,
      pauseCount: 0,
      bufferingEvents: 0,
      qualityChanges: []
    };

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Video start
    this.video.addEventListener('play', () => {
      if (!this.sessionData.startTime) {
        this.sessionData.startTime = Date.now();
        gtag('event', 'video_start', {
          video_title: this.video.dataset.title || 'Unknown',
          video_duration: this.video.duration,
          video_provider: 'video.js'
        });
      }
    });

    // Progress tracking
    let progressMarkers = [25, 50, 75, 90];
    let markersSent = [];

    this.video.addEventListener('timeupdate', () => {
      const percent = (this.video.currentTime / this.video.duration) * 100;

      progressMarkers.forEach(marker => {
        if (percent >= marker && !markersSent.includes(marker)) {
          markersSent.push(marker);
          gtag('event', 'video_progress', {
            video_title: this.video.dataset.title,
            video_percent: marker
          });
        }
      });
    });

    // Video complete
    this.video.addEventListener('ended', () => {
      const watchTime = (Date.now() - this.sessionData.startTime) / 1000;
      gtag('event', 'video_complete', {
        video_title: this.video.dataset.title,
        video_duration: this.video.duration,
        actual_watch_time: watchTime,
        pause_count: this.sessionData.pauseCount,
        buffering_events: this.sessionData.bufferingEvents
      });
    });

    // Error tracking
    this.video.addEventListener('error', (e) => {
      gtag('event', 'video_error', {
        video_title: this.video.dataset.title,
        error_code: e.target.error.code,
        error_message: e.target.error.message
      });
    });
  }
}
```

### Plausible Analytics (Self-Hosted)
**Purpose:** Privacy-focused, lightweight analytics
**Free Tier:** Completely free when self-hosted
**Docker Setup:**

```yaml
# docker-compose.yml for Plausible
version: '3.3'
services:
  plausible_db:
    image: postgres:14-alpine
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=postgres

  plausible_events_db:
    image: clickhouse/clickhouse-server:22.6-alpine
    volumes:
      - event-data:/var/lib/clickhouse

  plausible:
    image: plausible/analytics:latest
    ports:
      - 8000:8000
    environment:
      - BASE_URL=http://localhost:8000
      - SECRET_KEY_BASE=your-secret-key
      - DATABASE_URL=postgres://postgres:postgres@plausible_db:5432/plausible_db
      - CLICKHOUSE_DATABASE_URL=http://plausible_events_db:8123/plausible_events_db
```

### Matomo (Self-Hosted)
**Purpose:** Full-featured analytics alternative to GA
**Free Tier:** Completely free when self-hosted
**Video Tracking:**

```javascript
// Matomo Media Analytics
_paq.push(['MediaAnalytics::scanForMedia']);

// Custom video tracking
_paq.push(['trackEvent', 'Videos', 'Play', videoTitle]);
_paq.push(['trackEvent', 'Videos', 'Finished', videoTitle, watchedSeconds]);
```

### PostHog
**Purpose:** Product analytics with session recording
**Free Tier:** 1M events/month, 5K sessions
**Implementation:**

```javascript
// PostHog video analytics
posthog.capture('video_interaction', {
  video_id: 'video_123',
  action: 'play',
  timestamp: new Date().toISOString(),
  current_time: video.currentTime,
  duration: video.duration,
  quality: getCurrentQuality(),
  buffered_percentage: getBufferedPercentage()
});
```

---

## 3. A/B Testing & Feature Flags

### GrowthBook (Open Source)
**Purpose:** Feature flags and A/B testing
**Free Tier:** Completely free when self-hosted
**Implementation:**

```javascript
import { GrowthBook } from "@growthbook/growthbook";

const gb = new GrowthBook({
  apiHost: "https://cdn.growthbook.io",
  clientKey: "sdk-abc123",
  attributes: {
    id: user.id,
    deviceType: getDeviceType(),
    browser: getBrowser()
  }
});

// Video player feature flags
async function initVideoPlayer() {
  await gb.loadFeatures();

  const config = {
    autoplay: gb.getFeatureValue("video-autoplay", false),
    defaultQuality: gb.getFeatureValue("default-video-quality", "720p"),
    showCaptions: gb.getFeatureValue("auto-captions", true),
    playerSkin: gb.getFeatureValue("player-skin", "default")
  };

  // Track experiment exposure
  if (gb.getFeatureValue("new-player-ui", false)) {
    gb.trackingCallback = (experiment, result) => {
      analytics.track("Experiment Viewed", {
        experimentId: experiment.key,
        variationId: result.variationId
      });
    };
  }

  return config;
}
```

### Unleash (Feature Flags)
**Purpose:** Feature toggle service
**Free Tier:** Open source, self-hosted
**Docker Setup:**

```bash
docker run -d \
  -p 4242:4242 \
  -e DATABASE_URL=postgres://user:pass@host:5432/unleash \
  unleashorg/unleash-server
```

### Flagsmith
**Purpose:** Feature flags with remote config
**Free Tier:** 50K requests/month
**Integration:**

```javascript
import Flagsmith from 'flagsmith';

const flagsmith = new Flagsmith({
  environmentKey: 'YOUR_ENV_KEY'
});

// Video feature configuration
flagsmith.init({
  onChange: (oldFlags, params) => {
    const videoConfig = {
      enableHD: flagsmith.hasFeature('hd_streaming'),
      maxBitrate: flagsmith.getValue('max_bitrate'),
      adaptiveBitrate: flagsmith.hasFeature('adaptive_bitrate')
    };

    updateVideoPlayer(videoConfig);
  }
});
```

---

## 4. Error Tracking

### Sentry
**Purpose:** Error monitoring and performance tracking
**Free Tier:** 5K errors/month, 10K performance units
**Video Error Tracking:**

```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 0.1, // 10% of transactions
});

// Video error handling
class VideoErrorTracker {
  constructor(videoElement) {
    this.video = videoElement;
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.video.addEventListener('error', (e) => {
      const error = e.target.error;

      Sentry.captureException(new Error('Video playback error'), {
        tags: {
          component: 'video-player'
        },
        extra: {
          errorCode: error?.code,
          errorMessage: error?.message,
          videoSrc: this.video.currentSrc,
          currentTime: this.video.currentTime,
          duration: this.video.duration,
          networkState: this.video.networkState,
          readyState: this.video.readyState
        }
      });
    });

    // HLS.js error handling
    if (window.Hls) {
      hls.on(Hls.Events.ERROR, (event, data) => {
        Sentry.captureException(new Error('HLS Error'), {
          extra: {
            type: data.type,
            details: data.details,
            fatal: data.fatal,
            url: data.url
          }
        });
      });
    }
  }
}
```

### Rollbar
**Purpose:** Real-time error tracking
**Free Tier:** 5K events/month
**Setup:**

```javascript
var _rollbarConfig = {
  accessToken: "YOUR_ACCESS_TOKEN",
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    environment: "production",
    context: "video-player"
  }
};

// Video error logging
Rollbar.error("Video failed to load", {
  url: videoUrl,
  error: errorDetails,
  browser: navigator.userAgent
});
```

### LogRocket
**Purpose:** Session replay with error tracking
**Free Tier:** 1K sessions/month
**Integration:**

```javascript
import LogRocket from 'logrocket';

LogRocket.init('app-id/video-app');

// Identify user
LogRocket.identify('user123', {
  name: 'Test User',
  subscription: 'free'
});

// Track video errors with session context
LogRocket.captureException(error, {
  tags: {
    videoId: currentVideoId,
    playerState: getPlayerState()
  }
});
```

---

## 5. Video-Specific Analytics

### Video.js Analytics Plugin
**Purpose:** Built-in video metrics collection
**Free Tier:** Completely free
**Implementation:**

```javascript
// Custom Video.js Analytics Plugin
videojs.registerPlugin('analytics', function(options) {
  const player = this;
  const data = {
    sessionId: generateSessionId(),
    events: [],
    metrics: {}
  };

  // Core metrics collection
  const collectMetrics = () => {
    return {
      timestamp: Date.now(),
      currentTime: player.currentTime(),
      duration: player.duration(),
      buffered: player.buffered().length > 0 ?
        player.buffered().end(0) : 0,
      volume: player.volume(),
      playbackRate: player.playbackRate(),
      resolution: player.currentSource()?.res,
      bandwidth: player.tech_.hls?.bandwidth
    };
  };

  // Event tracking
  ['play', 'pause', 'ended', 'error', 'waiting', 'seeked'].forEach(event => {
    player.on(event, () => {
      data.events.push({
        type: event,
        time: Date.now(),
        metrics: collectMetrics()
      });

      // Send to backend
      if (data.events.length >= 10) {
        sendAnalytics(data);
        data.events = [];
      }
    });
  });

  // Quality changes
  player.on('qualitychange', (e, quality) => {
    data.events.push({
      type: 'quality_change',
      from: e.oldQuality,
      to: quality,
      time: Date.now()
    });
  });

  // Periodic metrics collection
  setInterval(() => {
    if (!player.paused()) {
      data.metrics = collectMetrics();
      sendMetrics(data.metrics);
    }
  }, options.interval || 30000); // Every 30 seconds
});

// Initialize
videojs('my-video').analytics({
  endpoint: '/api/analytics',
  interval: 30000
});
```

### YouTube Analytics API (For Comparison)
**Purpose:** Benchmark against YouTube metrics
**Free Tier:** Free with quotas
**Usage:**

```javascript
// Compare your metrics with YouTube
async function getYouTubeMetrics(videoId) {
  const response = await gapi.client.youtube.videos.list({
    part: 'statistics,contentDetails',
    id: videoId
  });

  return {
    views: response.result.items[0].statistics.viewCount,
    likes: response.result.items[0].statistics.likeCount,
    duration: response.result.items[0].contentDetails.duration,
    // Use for benchmarking engagement rates
  };
}
```

### Custom Implementation Patterns

```javascript
// Comprehensive video analytics collector
class VideoAnalytics {
  constructor(player, config = {}) {
    this.player = player;
    this.config = {
      endpoint: config.endpoint || '/api/analytics',
      batchSize: config.batchSize || 20,
      flushInterval: config.flushInterval || 30000,
      ...config
    };

    this.session = {
      id: this.generateSessionId(),
      startTime: null,
      events: [],
      metrics: {
        totalWatchTime: 0,
        bufferingTime: 0,
        seekCount: 0,
        qualityChanges: [],
        errors: []
      }
    };

    this.init();
  }

  init() {
    // Session start
    this.player.one('play', () => {
      this.session.startTime = Date.now();
      this.track('session_start', {
        url: window.location.href,
        referrer: document.referrer,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connection: navigator.connection?.effectiveType
      });
    });

    // Engagement tracking
    this.trackEngagement();

    // Performance tracking
    this.trackPerformance();

    // Error tracking
    this.trackErrors();

    // Periodic flush
    setInterval(() => this.flush(), this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush(true));
  }

  trackEngagement() {
    let lastTime = 0;
    let watchTime = 0;

    this.player.on('timeupdate', () => {
      const currentTime = this.player.currentTime();
      if (currentTime > lastTime) {
        watchTime += currentTime - lastTime;
        this.session.metrics.totalWatchTime = watchTime;
      }
      lastTime = currentTime;
    });

    // Interaction tracking
    ['play', 'pause', 'seeked', 'ratechange', 'volumechange'].forEach(event => {
      this.player.on(event, (e) => {
        this.track(event, {
          currentTime: this.player.currentTime(),
          detail: event === 'ratechange' ? this.player.playbackRate() :
                 event === 'volumechange' ? this.player.volume() : null
        });
      });
    });
  }

  trackPerformance() {
    let bufferingStart = null;

    this.player.on('waiting', () => {
      bufferingStart = Date.now();
      this.track('buffering_start', {
        currentTime: this.player.currentTime()
      });
    });

    this.player.on('playing', () => {
      if (bufferingStart) {
        const bufferingDuration = Date.now() - bufferingStart;
        this.session.metrics.bufferingTime += bufferingDuration;
        this.track('buffering_end', {
          duration: bufferingDuration
        });
        bufferingStart = null;
      }
    });

    // Network metrics
    if (this.player.tech_.hls) {
      this.player.tech_.hls.on('hlsStats', (stats) => {
        this.track('network_stats', {
          bandwidth: stats.bandwidth,
          downloadTime: stats.downloadTime,
          ttfb: stats.ttfb
        });
      });
    }
  }

  trackErrors() {
    this.player.on('error', (error) => {
      const errorData = {
        code: error.code,
        message: error.message,
        currentTime: this.player.currentTime(),
        currentSrc: this.player.currentSrc()
      };

      this.session.metrics.errors.push(errorData);
      this.track('error', errorData);

      // Immediate flush for errors
      this.flush(true);
    });
  }

  track(eventName, data = {}) {
    const event = {
      name: eventName,
      timestamp: Date.now(),
      sessionId: this.session.id,
      data: {
        ...data,
        playerState: {
          paused: this.player.paused(),
          ended: this.player.ended(),
          currentTime: this.player.currentTime(),
          duration: this.player.duration()
        }
      }
    };

    this.session.events.push(event);

    if (this.session.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  flush(immediate = false) {
    if (this.session.events.length === 0) return;

    const payload = {
      sessionId: this.session.id,
      events: [...this.session.events],
      metrics: { ...this.session.metrics }
    };

    this.session.events = [];

    const send = () => {
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(console.error);
    };

    if (immediate) {
      // Use sendBeacon for reliability on page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.config.endpoint, JSON.stringify(payload));
      } else {
        send();
      }
    } else {
      send();
    }
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 6. Debugging Tools

### Chrome Media Internals
**Purpose:** Deep dive into media playback issues
**Access:** chrome://media-internals
**Usage:**

```javascript
// Log to Chrome Media Internals
console.log('Media Session Debug:', {
  readyState: video.readyState,
  networkState: video.networkState,
  error: video.error,
  buffered: video.buffered,
  seekable: video.seekable,
  played: video.played
});

// Automated collection
function collectMediaInternals() {
  const video = document.querySelector('video');
  const debug = {
    timestamp: new Date().toISOString(),
    properties: {},
    events: []
  };

  // Collect all video properties
  ['currentTime', 'duration', 'paused', 'ended', 'error',
   'networkState', 'readyState', 'buffered', 'seekable'].forEach(prop => {
    try {
      debug.properties[prop] = video[prop];
    } catch(e) {
      debug.properties[prop] = 'Error: ' + e.message;
    }
  });

  // Get playback quality
  if (video.getVideoPlaybackQuality) {
    const quality = video.getVideoPlaybackQuality();
    debug.quality = {
      creationTime: quality.creationTime,
      droppedVideoFrames: quality.droppedVideoFrames,
      totalVideoFrames: quality.totalVideoFrames
    };
  }

  return debug;
}
```

### Video.js Debug Plugin
**Purpose:** Enhanced debugging for Video.js
**Implementation:**

```javascript
// Video.js Debug Plugin
videojs.registerPlugin('debug', function(options) {
  const player = this;
  const debugOverlay = document.createElement('div');
  debugOverlay.className = 'vjs-debug-overlay';
  debugOverlay.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    z-index: 9999;
    max-width: 300px;
  `;

  player.el().appendChild(debugOverlay);

  const update = () => {
    const tech = player.tech_;
    const hls = tech.hls;

    const debugInfo = {
      'Time': `${player.currentTime().toFixed(2)} / ${player.duration().toFixed(2)}`,
      'State': `${player.readyState()} / ${player.networkState()}`,
      'Buffered': player.buffered().length > 0 ?
        `${player.buffered().end(0).toFixed(2)}s` : '0s',
      'Resolution': player.currentSource()?.res || 'unknown',
      'Bitrate': hls ? `${(hls.bandwidth / 1000000).toFixed(2)} Mbps` : 'N/A',
      'Dropped Frames': tech.el().getVideoPlaybackQuality ?
        tech.el().getVideoPlaybackQuality().droppedVideoFrames : 'N/A',
      'Buffer Health': player.buffered().length > 0 ?
        `${(player.buffered().end(0) - player.currentTime()).toFixed(2)}s` : '0s',
      'Live Latency': hls?.liveSyncPosition ?
        `${(hls.liveSyncPosition - player.currentTime()).toFixed(2)}s` : 'N/A'
    };

    debugOverlay.innerHTML = Object.entries(debugInfo)
      .map(([key, value]) => `<div>${key}: ${value}</div>`)
      .join('');
  };

  player.on(['timeupdate', 'progress', 'loadedmetadata'], update);
  setInterval(update, 1000);

  // Console logging
  if (options.verbose) {
    ['loadstart', 'loadedmetadata', 'loadeddata', 'play', 'pause',
     'waiting', 'playing', 'ended', 'error'].forEach(event => {
      player.on(event, (e) => {
        console.log(`[Video.js Debug] ${event}:`, {
          currentTime: player.currentTime(),
          buffered: player.buffered(),
          state: player.readyState()
        });
      });
    });
  }
});
```

### Wireshark (Network Analysis)
**Purpose:** Deep packet inspection for streaming issues
**Free Tier:** Completely free
**Filter for video streaming:**

```
# Wireshark filters for video analysis
http.request.uri contains ".m3u8" or http.request.uri contains ".ts"
http.response.code == 206
tcp.analysis.retransmission
```

---

## 7. Synthetic Monitoring

### Playwright
**Purpose:** Automated browser testing with video
**Free Tier:** Completely free
**Video Testing:**

```javascript
// Playwright video performance testing
const { chromium } = require('playwright');

async function testVideoPerformance(url) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: './videos',
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  // Collect performance metrics
  await page.evaluateOnNewDocument(() => {
    window.videoMetrics = {
      events: [],
      errors: []
    };

    document.addEventListener('DOMContentLoaded', () => {
      const video = document.querySelector('video');
      if (video) {
        ['loadstart', 'loadeddata', 'canplay', 'play', 'pause',
         'waiting', 'playing', 'ended', 'error'].forEach(event => {
          video.addEventListener(event, (e) => {
            window.videoMetrics.events.push({
              type: event,
              time: performance.now(),
              currentTime: video.currentTime,
              buffered: video.buffered.length > 0 ?
                video.buffered.end(0) : 0
            });
          });
        });
      }
    });
  });

  // Navigate and start testing
  await page.goto(url);

  // Wait for video element
  const video = await page.waitForSelector('video', { timeout: 10000 });

  // Play video
  await video.evaluate(v => v.play());

  // Wait for playback to start
  await page.waitForFunction(
    () => {
      const v = document.querySelector('video');
      return v && v.currentTime > 0;
    },
    { timeout: 10000 }
  );

  // Collect metrics during playback
  const metrics = await page.evaluate(() => {
    const video = document.querySelector('video');
    const perf = performance.getEntriesByType('navigation')[0];

    return {
      pageLoad: perf.loadEventEnd - perf.loadEventStart,
      videoLoadTime: window.videoMetrics.events
        .find(e => e.type === 'loadeddata')?.time || null,
      timeToFirstFrame: window.videoMetrics.events
        .find(e => e.type === 'playing')?.time || null,
      bufferingEvents: window.videoMetrics.events
        .filter(e => e.type === 'waiting').length,
      errors: window.videoMetrics.errors,
      droppedFrames: video.getVideoPlaybackQuality ?
        video.getVideoPlaybackQuality().droppedVideoFrames : null
    };
  });

  await browser.close();
  return metrics;
}

// Run tests periodically
async function monitorVideo() {
  const results = await testVideoPerformance('https://your-site.com/video');

  // Send to your analytics platform
  console.log('Test results:', results);

  // Alert on performance degradation
  if (results.timeToFirstFrame > 5000) {
    console.error('Video taking too long to start!');
  }
}

// Schedule synthetic monitoring
setInterval(monitorVideo, 3600000); // Every hour
```

### Puppeteer
**Purpose:** Headless browser automation
**Free Tier:** Completely free
**Performance Testing:**

```javascript
const puppeteer = require('puppeteer');

async function measureVideoMetrics(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Enable performance tracking
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.performanceMetrics.push({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          transferSize: entry.transferSize
        });
      }
    });

    observer.observe({ entryTypes: ['resource', 'measure', 'navigation'] });
  });

  // CDP for advanced metrics
  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');

  // Navigate
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Get performance metrics
  const performanceMetrics = await client.send('Performance.getMetrics');
  const videoMetrics = await page.evaluate(() => {
    const video = document.querySelector('video');
    if (!video) return null;

    return {
      currentSrc: video.currentSrc,
      duration: video.duration,
      buffered: video.buffered.length > 0 ?
        video.buffered.end(0) : 0,
      readyState: video.readyState,
      networkState: video.networkState
    };
  });

  await browser.close();

  return {
    performance: performanceMetrics.metrics,
    video: videoMetrics,
    resources: await page.evaluate(() => window.performanceMetrics)
  };
}
```

### Selenium Grid (Self-Hosted)
**Purpose:** Cross-browser testing at scale
**Free Tier:** Completely free
**Docker Setup:**

```yaml
# docker-compose.yml for Selenium Grid
version: '3'
services:
  selenium-hub:
    image: selenium/hub:latest
    ports:
      - "4444:4444"

  chrome:
    image: selenium/node-chrome:latest
    depends_on:
      - selenium-hub
    environment:
      - HUB_HOST=selenium-hub

  firefox:
    image: selenium/node-firefox:latest
    depends_on:
      - selenium-hub
    environment:
      - HUB_HOST=selenium-hub
```

---

## 8. User Behavior Analytics

### Microsoft Clarity
**Purpose:** Session recordings and heatmaps
**Free Tier:** Completely free, unlimited
**Integration:**

```javascript
// Microsoft Clarity with video tracking
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "YOUR_PROJECT_ID");

// Custom video events
clarity("set", "video_interaction", {
  action: "play",
  videoId: "video_123",
  duration: video.duration
});
```

### Hotjar
**Purpose:** User behavior analytics
**Free Tier:** Up to 35 sessions/day
**Video Interaction Tracking:**

```javascript
// Track video interactions in Hotjar
hj('event', 'video_played');
hj('event', 'video_completed');

// Virtual pageviews for video sections
hj('vpv', '/video/section-1');
```

---

## 9. Integration Examples

### Complete Analytics Stack Implementation

```javascript
// Free Analytics Stack Manager
class FreeAnalyticsStack {
  constructor(config) {
    this.config = config;
    this.providers = [];
    this.initializeProviders();
  }

  initializeProviders() {
    // Google Analytics 4
    if (this.config.ga4) {
      this.providers.push({
        name: 'GA4',
        send: (event, data) => {
          if (window.gtag) {
            gtag('event', event, data);
          }
        }
      });
    }

    // PostHog
    if (this.config.posthog) {
      this.providers.push({
        name: 'PostHog',
        send: (event, data) => {
          if (window.posthog) {
            posthog.capture(event, data);
          }
        }
      });
    }

    // Custom endpoint
    if (this.config.customEndpoint) {
      this.providers.push({
        name: 'Custom',
        send: async (event, data) => {
          try {
            await fetch(this.config.customEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ event, data, timestamp: Date.now() })
            });
          } catch (error) {
            console.error('Failed to send to custom endpoint:', error);
          }
        }
      });
    }

    // Sentry for errors
    if (this.config.sentry && window.Sentry) {
      this.providers.push({
        name: 'Sentry',
        send: (event, data) => {
          if (event.includes('error')) {
            Sentry.captureMessage(event, {
              level: 'error',
              extra: data
            });
          }
        }
      });
    }
  }

  track(event, data = {}) {
    // Add common properties
    const enrichedData = {
      ...data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    };

    // Send to all providers
    this.providers.forEach(provider => {
      try {
        provider.send(event, enrichedData);
      } catch (error) {
        console.error(`Failed to send to ${provider.name}:`, error);
      }
    });
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
}

// Initialize the stack
const analytics = new FreeAnalyticsStack({
  ga4: true,
  posthog: true,
  customEndpoint: '/api/analytics',
  sentry: true
});

// Video player integration
class AnalyticsEnabledVideoPlayer {
  constructor(videoElement, analytics) {
    this.video = videoElement;
    this.analytics = analytics;
    this.metrics = new VideoMetricsCollector(videoElement);
    this.setupTracking();
  }

  setupTracking() {
    // Quality of Experience (QoE) metrics
    this.trackQoE();

    // Engagement metrics
    this.trackEngagement();

    // Technical metrics
    this.trackTechnical();

    // Business metrics
    this.trackBusiness();
  }

  trackQoE() {
    // Time to first frame
    let startTime = null;
    this.video.addEventListener('loadstart', () => {
      startTime = performance.now();
    });

    this.video.addEventListener('playing', () => {
      if (startTime) {
        const ttff = performance.now() - startTime;
        this.analytics.track('video_qoe_ttff', {
          duration_ms: ttff,
          video_id: this.video.dataset.videoId
        });
        startTime = null;
      }
    });

    // Rebuffering
    let bufferStart = null;
    this.video.addEventListener('waiting', () => {
      bufferStart = performance.now();
      this.analytics.track('video_buffering_start', {
        current_time: this.video.currentTime
      });
    });

    this.video.addEventListener('playing', () => {
      if (bufferStart) {
        const bufferDuration = performance.now() - bufferStart;
        this.analytics.track('video_buffering_end', {
          duration_ms: bufferDuration,
          current_time: this.video.currentTime
        });
        bufferStart = null;
      }
    });
  }

  trackEngagement() {
    // View segments
    const segments = [0, 25, 50, 75, 100];
    const tracked = new Set();

    this.video.addEventListener('timeupdate', () => {
      const percent = (this.video.currentTime / this.video.duration) * 100;

      segments.forEach(segment => {
        if (percent >= segment && !tracked.has(segment)) {
          tracked.add(segment);
          this.analytics.track('video_progress', {
            percent: segment,
            video_id: this.video.dataset.videoId
          });
        }
      });
    });

    // Interaction events
    ['play', 'pause', 'seek', 'fullscreenchange'].forEach(event => {
      this.video.addEventListener(event, () => {
        this.analytics.track(`video_${event}`, {
          current_time: this.video.currentTime,
          video_id: this.video.dataset.videoId
        });
      });
    });
  }

  trackTechnical() {
    // Periodic technical metrics
    setInterval(() => {
      if (!this.video.paused) {
        const metrics = this.metrics.collect();
        this.analytics.track('video_technical_metrics', metrics);
      }
    }, 30000); // Every 30 seconds
  }

  trackBusiness() {
    // Ad events (if applicable)
    if (this.video.dataset.hasAds) {
      this.video.addEventListener('adstart', () => {
        this.analytics.track('video_ad_start', {
          ad_id: this.video.dataset.currentAdId
        });
      });

      this.video.addEventListener('adend', () => {
        this.analytics.track('video_ad_complete', {
          ad_id: this.video.dataset.currentAdId
        });
      });
    }

    // Conversion events
    this.video.addEventListener('ended', () => {
      this.analytics.track('video_complete', {
        video_id: this.video.dataset.videoId,
        watch_time: this.metrics.getTotalWatchTime()
      });
    });
  }
}

class VideoMetricsCollector {
  constructor(videoElement) {
    this.video = videoElement;
    this.startTime = null;
    this.totalWatchTime = 0;
    this.lastUpdateTime = 0;
  }

  collect() {
    const quality = this.video.getVideoPlaybackQuality ?
      this.video.getVideoPlaybackQuality() : {};

    return {
      // Performance metrics
      dropped_frames: quality.droppedVideoFrames || 0,
      total_frames: quality.totalVideoFrames || 0,
      corruption_count: quality.corruptedVideoFrames || 0,

      // Buffer metrics
      buffer_level: this.getBufferLevel(),
      buffer_health: this.getBufferHealth(),

      // Network metrics
      bandwidth: this.estimateBandwidth(),

      // Playback metrics
      current_time: this.video.currentTime,
      duration: this.video.duration,
      playback_rate: this.video.playbackRate,
      volume: this.video.volume,

      // State
      ready_state: this.video.readyState,
      network_state: this.video.networkState,
      is_live: this.video.duration === Infinity
    };
  }

  getBufferLevel() {
    if (this.video.buffered.length === 0) return 0;
    return this.video.buffered.end(0) - this.video.currentTime;
  }

  getBufferHealth() {
    const bufferLevel = this.getBufferLevel();
    if (bufferLevel > 10) return 'excellent';
    if (bufferLevel > 5) return 'good';
    if (bufferLevel > 2) return 'fair';
    return 'poor';
  }

  estimateBandwidth() {
    // Simplified bandwidth estimation
    if (this.video.tech?.hls) {
      return this.video.tech.hls.bandwidth;
    }
    return null;
  }

  getTotalWatchTime() {
    if (!this.video.paused) {
      this.totalWatchTime += this.video.currentTime - this.lastUpdateTime;
    }
    this.lastUpdateTime = this.video.currentTime;
    return this.totalWatchTime;
  }
}
```

---

## 10. Best Practices

### 1. Start Small, Scale Gradually
- Begin with GA4 + Sentry (both free)
- Add specialized tools as you identify specific needs
- Don't implement everything at once

### 2. Data Privacy Compliance
```javascript
// GDPR-compliant analytics setup
class PrivacyCompliantAnalytics {
  constructor() {
    this.consentGiven = this.checkConsent();
  }

  checkConsent() {
    return localStorage.getItem('analytics_consent') === 'true';
  }

  requestConsent() {
    // Show consent banner
    const consent = confirm('Allow analytics to improve your experience?');
    if (consent) {
      localStorage.setItem('analytics_consent', 'true');
      this.consentGiven = true;
      this.initializeAnalytics();
    }
    return consent;
  }

  initializeAnalytics() {
    if (!this.consentGiven) return;

    // Initialize only after consent
    this.loadGA4();
    this.loadClarity();
  }

  track(event, data) {
    if (!this.consentGiven) return;

    // Only track with consent
    gtag('event', event, data);
  }
}
```

### 3. Performance Budget
```javascript
// Limit analytics impact
class PerformanceBudgetedAnalytics {
  constructor(maxTime = 50) {
    this.maxExecutionTime = maxTime; // ms
    this.queue = [];
    this.processing = false;
  }

  track(event, data) {
    this.queue.push({ event, data, timestamp: Date.now() });

    if (!this.processing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.processing = true;
    const startTime = performance.now();

    while (this.queue.length > 0 &&
           performance.now() - startTime < this.maxExecutionTime) {
      const item = this.queue.shift();
      await this.send(item);
    }

    this.processing = false;

    // Continue later if queue not empty
    if (this.queue.length > 0) {
      requestIdleCallback(() => this.processQueue());
    }
  }

  async send(item) {
    // Use beacon API for better performance
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/analytics', JSON.stringify(item));
    } else {
      // Fallback
      fetch('/analytics', {
        method: 'POST',
        body: JSON.stringify(item),
        keepalive: true
      });
    }
  }
}
```

### 4. Actionable Metrics Focus
Focus on metrics that drive decisions:
- **Engagement**: Watch time, completion rate
- **Performance**: TTFF, rebuffering ratio
- **Quality**: Bitrate switches, resolution distribution
- **Errors**: Error rate by type, recovery success

### 5. Self-Hosting Considerations
```yaml
# Docker Compose for complete self-hosted stack
version: '3.8'

services:
  # Plausible Analytics
  plausible:
    image: plausible/analytics:latest
    ports:
      - "8000:8000"
    environment:
      BASE_URL: http://localhost:8000
      SECRET_KEY_BASE: ${SECRET_KEY}
    volumes:
      - plausible-data:/var/lib/plausible

  # Matomo
  matomo:
    image: matomo:latest
    ports:
      - "8080:80"
    volumes:
      - matomo-data:/var/www/html

  # GrowthBook
  growthbook:
    image: growthbook/growthbook:latest
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://mongo:27017/growthbook

  # MongoDB for GrowthBook
  mongo:
    image: mongo:5
    volumes:
      - mongo-data:/data/db

volumes:
  plausible-data:
  matomo-data:
  mongo-data:
```

### 6. Cost Optimization Tips

1. **Batch API calls** - Reduce request volume
2. **Sample data** - Not every user needs tracking
3. **Use CDN caching** - For analytics scripts
4. **Compress payloads** - Reduce bandwidth
5. **Archive old data** - Move to cold storage

### 7. Testing Analytics Implementation
```javascript
// Analytics testing suite
class AnalyticsTestSuite {
  constructor(analytics) {
    this.analytics = analytics;
    this.results = [];
  }

  async runTests() {
    await this.testEventTracking();
    await this.testDataAccuracy();
    await this.testPerformanceImpact();
    await this.testErrorHandling();

    return this.results;
  }

  async testEventTracking() {
    const testEvent = 'test_video_play';
    const testData = { video_id: 'test_123' };

    // Intercept network requests
    const captured = await this.captureRequest(() => {
      this.analytics.track(testEvent, testData);
    });

    this.results.push({
      test: 'Event Tracking',
      passed: captured.includes(testEvent),
      details: captured
    });
  }

  async testPerformanceImpact() {
    const metrics = [];

    // Measure without analytics
    const baselinePerf = await this.measurePerformance(() => {
      // Baseline operation
    });

    // Measure with analytics
    const analyticsPerf = await this.measurePerformance(() => {
      for (let i = 0; i < 100; i++) {
        this.analytics.track('perf_test', { index: i });
      }
    });

    const overhead = analyticsPerf - baselinePerf;

    this.results.push({
      test: 'Performance Impact',
      passed: overhead < 50, // Less than 50ms overhead
      details: { baseline: baselinePerf, withAnalytics: analyticsPerf, overhead }
    });
  }

  async captureRequest(fn) {
    const originalFetch = window.fetch;
    let captured = null;

    window.fetch = function(...args) {
      captured = args[0];
      return Promise.resolve({ ok: true });
    };

    fn();

    window.fetch = originalFetch;
    return captured;
  }

  async measurePerformance(fn) {
    const start = performance.now();
    await fn();
    return performance.now() - start;
  }
}
```

---

## Conclusion

This guide provides a comprehensive toolkit for implementing analytics in video streaming applications with zero budget. Key takeaways:

1. **Start with essentials**: GA4 + Sentry provide 80% of needed insights
2. **Self-host when possible**: Plausible, Matomo, GrowthBook offer full control
3. **Focus on video-specific metrics**: TTFF, rebuffering, quality switches
4. **Automate testing**: Use Playwright/Puppeteer for synthetic monitoring
5. **Respect privacy**: Implement proper consent mechanisms
6. **Monitor performance impact**: Keep analytics lightweight

Remember: Good analytics is about asking the right questions, not collecting all possible data. Start simple, iterate based on needs, and always prioritize user experience over data collection.

## Resources

- [Video.js Analytics Plugin](https://github.com/videojs/videojs-analytics)
- [Web Video Analytics Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)
- [Google Analytics 4 Documentation](https://developers.google.com/analytics)
- [Plausible Self-Hosting Guide](https://plausible.io/docs/self-hosting)
- [Sentry JavaScript Documentation](https://docs.sentry.io/platforms/javascript/)