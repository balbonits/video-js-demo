# Video Player Event Schemas

Comprehensive event schemas and data structures for video player implementations.

## Event Categories

1. **Lifecycle Events** - Player initialization and teardown
2. **Playback Events** - Play, pause, seek, etc.
3. **Quality Events** - Bitrate changes and quality switches
4. **Network Events** - Loading, buffering, errors
5. **User Interaction Events** - Clicks, keyboard, touch
6. **Analytics Events** - Metrics and tracking
7. **Ad Events** - Advertisement lifecycle
8. **DRM Events** - License and key management

## Event Naming Conventions

```
category:action:status
```

Examples:
- `playback:play:started`
- `network:segment:loaded`
- `quality:level:changed`
- `ad:break:started`

## Core Event Schemas

### Lifecycle Events

#### player:ready
Fired when player is fully initialized and ready for playback.

```json
{
  "event": "player:ready",
  "timestamp": 1634567890123,
  "data": {
    "playerId": "player-123",
    "version": "2.0.0",
    "features": ["hls", "dash", "drm"],
    "container": {
      "width": 1920,
      "height": 1080
    }
  }
}
```

#### player:destroy
Fired when player is being destroyed.

```json
{
  "event": "player:destroy",
  "timestamp": 1634567890123,
  "data": {
    "playerId": "player-123",
    "reason": "user_navigation" | "error" | "manual"
  }
}
```

### Playback Events

#### playback:play:requested
User or autoplay initiates playback.

```json
{
  "event": "playback:play:requested",
  "timestamp": 1634567890123,
  "data": {
    "autoplay": false,
    "currentTime": 0,
    "source": "user_interaction" | "autoplay" | "api"
  }
}
```

#### playback:play:started
Actual playback begins.

```json
{
  "event": "playback:play:started",
  "timestamp": 1634567890123,
  "data": {
    "currentTime": 0,
    "startupTime": 1250,
    "bufferLevel": 10.5,
    "quality": {
      "width": 1920,
      "height": 1080,
      "bitrate": 5000000
    }
  }
}
```

#### playback:pause
Playback paused.

```json
{
  "event": "playback:pause",
  "timestamp": 1634567890123,
  "data": {
    "currentTime": 45.67,
    "reason": "user_interaction" | "buffer_empty" | "api",
    "duration": 300.5
  }
}
```

#### playback:seek:started
Seek operation initiated.

```json
{
  "event": "playback:seek:started",
  "timestamp": 1634567890123,
  "data": {
    "from": 45.67,
    "to": 120.5,
    "method": "scrubber" | "keyboard" | "api"
  }
}
```

#### playback:seek:completed
Seek operation completed.

```json
{
  "event": "playback:seek:completed",
  "timestamp": 1634567890123,
  "data": {
    "from": 45.67,
    "to": 120.5,
    "seekTime": 850,
    "bufferRebuild": true
  }
}
```

#### playback:ended
Playback reached the end.

```json
{
  "event": "playback:ended",
  "timestamp": 1634567890123,
  "data": {
    "duration": 300.5,
    "watchedDuration": 285.3,
    "completionRate": 0.95
  }
}
```

### Progress Events

#### playback:time:update
Regular time updates during playback.

```json
{
  "event": "playback:time:update",
  "timestamp": 1634567890123,
  "data": {
    "currentTime": 45.67,
    "duration": 300.5,
    "playbackRate": 1.0,
    "remainingTime": 254.83
  }
}
```

#### playback:progress
Download progress updates.

```json
{
  "event": "playback:progress",
  "timestamp": 1634567890123,
  "data": {
    "buffered": [
      { "start": 0, "end": 60.5 },
      { "start": 120, "end": 180 }
    ],
    "currentTime": 45.67,
    "bufferHealth": 14.83,
    "downloadRate": 5242880
  }
}
```

### Quality Events

#### quality:level:changed
Quality level changed (manual or auto).

```json
{
  "event": "quality:level:changed",
  "timestamp": 1634567890123,
  "data": {
    "from": {
      "index": 2,
      "width": 1280,
      "height": 720,
      "bitrate": 2500000,
      "label": "720p"
    },
    "to": {
      "index": 4,
      "width": 1920,
      "height": 1080,
      "bitrate": 5000000,
      "label": "1080p"
    },
    "reason": "bandwidth_increase" | "manual" | "buffer_health",
    "isAuto": true,
    "bandwidth": 8000000
  }
}
```

#### quality:levels:updated
Available quality levels changed.

```json
{
  "event": "quality:levels:updated",
  "timestamp": 1634567890123,
  "data": {
    "levels": [
      {
        "index": 0,
        "width": 640,
        "height": 360,
        "bitrate": 800000,
        "label": "360p",
        "codecs": "avc1.42001e,mp4a.40.2"
      },
      {
        "index": 1,
        "width": 1280,
        "height": 720,
        "bitrate": 2500000,
        "label": "720p",
        "codecs": "avc1.64001f,mp4a.40.2"
      }
    ],
    "autoLevel": true,
    "currentLevel": 1
  }
}
```

### Buffer Events

#### buffer:stalled
Playback stalled due to empty buffer.

```json
{
  "event": "buffer:stalled",
  "timestamp": 1634567890123,
  "data": {
    "currentTime": 45.67,
    "bufferLevel": 0,
    "lastSegment": {
      "url": "segment-123.ts",
      "duration": 2.0,
      "size": 524288
    }
  }
}
```

#### buffer:buffering:started
Buffering started.

```json
{
  "event": "buffer:buffering:started",
  "timestamp": 1634567890123,
  "data": {
    "currentTime": 45.67,
    "bufferLevel": 0.5,
    "reason": "seek" | "underrun" | "startup",
    "targetBuffer": 10
  }
}
```

#### buffer:buffering:ended
Buffering ended.

```json
{
  "event": "buffer:buffering:ended",
  "timestamp": 1634567890123,
  "data": {
    "currentTime": 45.67,
    "bufferLevel": 10.5,
    "bufferingDuration": 2500,
    "segmentsLoaded": 5
  }
}
```

### Network Events

#### network:request:started
Network request initiated.

```json
{
  "event": "network:request:started",
  "timestamp": 1634567890123,
  "data": {
    "requestId": "req-456",
    "url": "https://cdn.example.com/segment-123.ts",
    "type": "segment" | "manifest" | "key" | "init",
    "method": "GET",
    "headers": {
      "Range": "bytes=0-1023"
    }
  }
}
```

#### network:request:completed
Network request completed successfully.

```json
{
  "event": "network:request:completed",
  "timestamp": 1634567890123,
  "data": {
    "requestId": "req-456",
    "url": "https://cdn.example.com/segment-123.ts",
    "status": 200,
    "size": 524288,
    "duration": 150,
    "throughput": 3495253,
    "cached": false
  }
}
```

#### network:request:failed
Network request failed.

```json
{
  "event": "network:request:failed",
  "timestamp": 1634567890123,
  "data": {
    "requestId": "req-456",
    "url": "https://cdn.example.com/segment-123.ts",
    "status": 404,
    "error": "Not Found",
    "duration": 50,
    "retryCount": 0,
    "willRetry": true,
    "retryDelay": 1000
  }
}
```

### Error Events

#### error:playback
Playback error occurred.

```json
{
  "event": "error:playback",
  "timestamp": 1634567890123,
  "data": {
    "code": "MEDIA_ERR_DECODE",
    "message": "Failed to decode video frame",
    "severity": "fatal" | "warning",
    "technical": {
      "mediaError": 3,
      "details": "PIPELINE_ERROR_DECODE"
    },
    "context": {
      "currentTime": 45.67,
      "quality": "1080p",
      "codec": "avc1.64001f"
    },
    "recoverable": false
  }
}
```

#### error:network
Network error occurred.

```json
{
  "event": "error:network",
  "timestamp": 1634567890123,
  "data": {
    "code": "NETWORK_TIMEOUT",
    "message": "Request timed out",
    "severity": "warning",
    "url": "https://cdn.example.com/segment-123.ts",
    "status": 0,
    "retryCount": 2,
    "maxRetries": 3,
    "nextRetryDelay": 4000
  }
}
```

### User Interaction Events

#### ui:control:clicked
User clicked a control button.

```json
{
  "event": "ui:control:clicked",
  "timestamp": 1634567890123,
  "data": {
    "control": "play" | "pause" | "fullscreen" | "mute" | "settings",
    "currentState": "playing",
    "coordinates": {
      "x": 450,
      "y": 300
    }
  }
}
```

#### ui:scrubber:used
User interacted with seek bar.

```json
{
  "event": "ui:scrubber:used",
  "timestamp": 1634567890123,
  "data": {
    "action": "drag_start" | "dragging" | "drag_end",
    "from": 45.67,
    "to": 120.5,
    "method": "mouse" | "touch" | "keyboard"
  }
}
```

#### ui:keyboard:pressed
Keyboard shortcut used.

```json
{
  "event": "ui:keyboard:pressed",
  "timestamp": 1634567890123,
  "data": {
    "key": "space",
    "action": "play_pause",
    "modifiers": {
      "ctrl": false,
      "shift": false,
      "alt": false
    }
  }
}
```

### Analytics Events

#### analytics:session:started
Analytics session started.

```json
{
  "event": "analytics:session:started",
  "timestamp": 1634567890123,
  "data": {
    "sessionId": "sess-789",
    "userId": "user-456",
    "contentId": "content-123",
    "contentType": "vod" | "live",
    "device": {
      "type": "desktop" | "mobile" | "tablet" | "tv",
      "os": "Windows 10",
      "browser": "Chrome 94",
      "screenSize": "1920x1080"
    },
    "connection": {
      "type": "wifi" | "cellular" | "ethernet",
      "bandwidth": 10000000
    }
  }
}
```

#### analytics:heartbeat
Regular analytics heartbeat.

```json
{
  "event": "analytics:heartbeat",
  "timestamp": 1634567890123,
  "data": {
    "sessionId": "sess-789",
    "metrics": {
      "watchTime": 180.5,
      "bufferingTime": 2.3,
      "bufferingCount": 1,
      "averageBitrate": 3500000,
      "droppedFrames": 5,
      "currentQuality": "1080p",
      "bandwidth": 8500000
    }
  }
}
```

### Advertisement Events

#### ad:break:started
Ad break started.

```json
{
  "event": "ad:break:started",
  "timestamp": 1634567890123,
  "data": {
    "breakId": "break-001",
    "type": "preroll" | "midroll" | "postroll",
    "position": 0,
    "pods": 3,
    "duration": 30
  }
}
```

#### ad:impression
Ad impression tracked.

```json
{
  "event": "ad:impression",
  "timestamp": 1634567890123,
  "data": {
    "adId": "ad-567",
    "creativeId": "creative-890",
    "adSystem": "Google IMA",
    "title": "Product Advertisement",
    "duration": 15,
    "clickThroughUrl": "https://advertiser.com/landing",
    "pricing": {
      "model": "CPM",
      "value": 25.50,
      "currency": "USD"
    }
  }
}
```

#### ad:quartile
Ad quartile tracking.

```json
{
  "event": "ad:quartile",
  "timestamp": 1634567890123,
  "data": {
    "adId": "ad-567",
    "quartile": "first" | "midpoint" | "third" | "complete",
    "currentTime": 7.5,
    "duration": 30
  }
}
```

### DRM Events

#### drm:license:requested
DRM license requested.

```json
{
  "event": "drm:license:requested",
  "timestamp": 1634567890123,
  "data": {
    "drmType": "widevine" | "playready" | "fairplay",
    "contentId": "content-123",
    "sessionId": "drm-session-456",
    "licenseUrl": "https://license.example.com/widevine"
  }
}
```

#### drm:license:received
DRM license received.

```json
{
  "event": "drm:license:received",
  "timestamp": 1634567890123,
  "data": {
    "drmType": "widevine",
    "sessionId": "drm-session-456",
    "duration": 250,
    "expires": 1634571490123,
    "restrictions": {
      "hdcp": "1.4",
      "maxResolution": "1080p"
    }
  }
}
```

#### drm:key:status:changed
DRM key status changed.

```json
{
  "event": "drm:key:status:changed",
  "timestamp": 1634567890123,
  "data": {
    "sessionId": "drm-session-456",
    "keyId": "key-789",
    "oldStatus": "usable",
    "newStatus": "expired" | "released" | "output-restricted",
    "expirationTime": 1634571490123
  }
}
```

## Event Flow Diagrams

### Typical Playback Flow

```
player:ready
    ↓
playback:play:requested
    ↓
network:request:started (manifest)
    ↓
network:request:completed (manifest)
    ↓
quality:levels:updated
    ↓
network:request:started (segment)
    ↓
buffer:buffering:started
    ↓
network:request:completed (segment)
    ↓
buffer:buffering:ended
    ↓
playback:play:started
    ↓
playback:time:update (repeated)
    ↓
playback:ended
```

### Error Recovery Flow

```
network:request:failed
    ↓
error:network (warning)
    ↓
network:request:started (retry)
    ↓
network:request:completed
    ↓
playback:play:resumed
```

## Event Batching

For analytics purposes, events can be batched:

```json
{
  "batch": true,
  "sessionId": "sess-789",
  "events": [
    {
      "event": "playback:time:update",
      "timestamp": 1634567890123,
      "data": { "currentTime": 45.67 }
    },
    {
      "event": "quality:level:changed",
      "timestamp": 1634567891123,
      "data": { "from": "720p", "to": "1080p" }
    }
  ]
}
```

## Custom Events

Applications can define custom events following the schema:

```json
{
  "event": "custom:feature:action",
  "timestamp": 1634567890123,
  "data": {
    // Application-specific data
  },
  "metadata": {
    "version": "1.0",
    "source": "plugin-name"
  }
}
```

## Event Priority

Events have different priority levels for processing:

| Priority | Events | Description |
|----------|--------|-------------|
| Critical | error:*, drm:license:failed | Immediate action required |
| High | playback:*, buffer:stalled | Core functionality |
| Medium | quality:*, network:* | Performance related |
| Low | analytics:*, ui:* | Tracking and UI |

## Validation Schema

JSON Schema for event validation:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["event", "timestamp", "data"],
  "properties": {
    "event": {
      "type": "string",
      "pattern": "^[a-z]+:[a-z]+(?::[a-z]+)?$"
    },
    "timestamp": {
      "type": "number",
      "minimum": 0
    },
    "data": {
      "type": "object"
    },
    "metadata": {
      "type": "object"
    }
  }
}
```

## Implementation Example

```javascript
class EventEmitter {
  constructor() {
    this.handlers = new Map();
    this.eventQueue = [];
  }

  emit(eventName, data) {
    const event = {
      event: eventName,
      timestamp: Date.now(),
      data: data
    };

    // Validate event
    if (!this.validateEvent(event)) {
      console.error('Invalid event:', event);
      return;
    }

    // Queue event
    this.eventQueue.push(event);

    // Trigger handlers
    const handlers = this.handlers.get(eventName) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });

    // Batch send analytics
    this.batchAnalytics();
  }

  on(eventName, handler) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName).push(handler);
  }

  validateEvent(event) {
    return event.event &&
           event.timestamp &&
           event.data !== undefined;
  }

  batchAnalytics() {
    if (this.eventQueue.length >= 10) {
      this.sendAnalytics(this.eventQueue);
      this.eventQueue = [];
    }
  }
}
```

---

This document defines comprehensive event schemas for video player implementations. Following these schemas ensures consistent event tracking and analytics across different player implementations.