# Backend Services Architecture

Separate backend services repository that provides all server-side functionality for testing and demonstrating the video player ecosystem.

## Overview

The backend services project simulates and emulates real-world video streaming infrastructure, providing:
- Content delivery and streaming services
- Real-time analytics collection
- Live chat functionality
- Content management
- DRM simulation
- CDN behavior emulation
- User authentication and authorization
- Quality adaptation logic

## Repository Structure

```
video-player-services/
├── services/
│   ├── streaming/           # HLS/DASH manifest generation & serving
│   ├── analytics/           # Event collection & metrics aggregation
│   ├── chat/               # WebSocket-based live chat
│   ├── content/            # Video metadata & content management
│   ├── drm/                # DRM token generation & validation
│   ├── cdn/                # CDN edge server simulation
│   ├── auth/               # User authentication service
│   └── transcode/          # Video transcoding simulation
├── shared/
│   ├── database/           # Database schemas & migrations
│   ├── utils/              # Shared utilities
│   └── types/              # TypeScript definitions
├── infrastructure/
│   ├── docker/             # Docker configurations
│   └── k8s/                # Kubernetes manifests (if needed)
└── tests/                  # Integration tests
```

## Service Definitions

### 1. Streaming Service

Handles video content delivery with multiple protocols:

**Endpoints:**
- `GET /stream/hls/{videoId}/master.m3u8` - HLS master playlist
- `GET /stream/hls/{videoId}/{quality}/playlist.m3u8` - Quality-specific playlist
- `GET /stream/hls/{videoId}/{quality}/segment-{n}.ts` - Video segments
- `GET /stream/dash/{videoId}/manifest.mpd` - DASH manifest
- `GET /stream/progressive/{videoId}` - Progressive download
- `GET /stream/webrtc/offer` - WebRTC signaling

**Features:**
- Dynamic manifest generation based on available qualities
- Bandwidth adaptation simulation
- Segment caching
- Live streaming simulation with sliding window
- DVR functionality for live streams

### 2. Analytics Service

Collects and aggregates player metrics:

**Endpoints:**
- `POST /analytics/events` - Batch event ingestion
- `GET /analytics/metrics/{videoId}` - Video-specific metrics
- `GET /analytics/dashboard` - Real-time dashboard data
- `WebSocket /analytics/realtime` - Real-time metrics stream

**Event Types:**
- Player lifecycle (load, ready, error)
- Playback events (play, pause, seek, complete)
- Quality changes
- Buffer events
- Error tracking
- Performance metrics (startup time, rebuffering)

**Metrics Collected:**
```typescript
interface VideoMetrics {
  videoId: string;
  sessionId: string;
  userId?: string;

  // Performance
  startupTime: number;
  bufferingEvents: BufferEvent[];
  averageBitrate: number;

  // Engagement
  watchTime: number;
  completionRate: number;
  seekEvents: SeekEvent[];

  // Quality
  qualityChanges: QualityChange[];
  droppedFrames: number;

  // Errors
  errors: ErrorEvent[];
  errorRate: number;
}
```

### 3. Chat Service

Real-time chat for live streams:

**Endpoints:**
- `WebSocket /chat/room/{streamId}` - Join chat room
- `POST /chat/message` - Send message (REST fallback)
- `GET /chat/history/{streamId}` - Chat history
- `POST /chat/moderate` - Moderation actions

**Features:**
- WebSocket-based real-time messaging
- Message persistence
- Rate limiting
- Profanity filtering
- Emoji support
- User presence tracking
- Moderator tools

### 4. Content Management Service

Manages video metadata and playlists:

**Endpoints:**
- `GET /content/videos` - List videos
- `GET /content/video/{id}` - Video metadata
- `POST /content/video` - Upload video metadata
- `GET /content/playlists` - Get playlists
- `POST /content/playlist` - Create playlist
- `GET /content/recommendations/{videoId}` - Get recommendations

**Data Model:**
```typescript
interface Video {
  id: string;
  title: string;
  description: string;
  duration: number;
  thumbnail: string;

  // Streaming
  sources: Source[];
  qualities: Quality[];
  captions: Caption[];

  // Metadata
  tags: string[];
  category: string;
  uploadDate: Date;

  // Rights
  drmProtected: boolean;
  geoRestrictions?: string[];
  ageRating?: string;
}
```

### 5. DRM Service

Simulates content protection:

**Endpoints:**
- `POST /drm/license` - License acquisition
- `GET /drm/certificate` - DRM certificate
- `POST /drm/token` - Generate playback token
- `POST /drm/verify` - Verify token validity

**Features:**
- Token-based authorization
- Playback window enforcement
- Device registration
- Concurrent stream limits
- Geographic restrictions

### 6. CDN Simulator

Emulates CDN behavior:

**Endpoints:**
- `GET /cdn/content/{path}` - Serve cached content
- `GET /cdn/status` - CDN health status
- `POST /cdn/purge` - Cache purge

**Features:**
- Edge location simulation
- Cache hit/miss simulation
- Bandwidth throttling
- Geographic routing
- Request coalescing
- 206 Partial Content support

### 7. Authentication Service

User management and authentication:

**Endpoints:**
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh token
- `GET /auth/profile` - User profile

**Features:**
- JWT token generation
- Session management
- User profiles
- Subscription tiers
- Device management

### 8. Transcode Service

Simulates video processing:

**Endpoints:**
- `POST /transcode/job` - Submit transcode job
- `GET /transcode/status/{jobId}` - Job status
- `GET /transcode/progress/{jobId}` - Progress updates

**Features:**
- Quality ladder generation simulation
- Progress reporting
- Thumbnail generation
- Subtitle conversion
- Audio normalization simulation

## Database Schema

### Core Tables

```sql
-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  duration INTEGER,
  upload_date TIMESTAMP,
  status VARCHAR(50)
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE,
  subscription_tier VARCHAR(50),
  created_at TIMESTAMP
);

-- Analytics Events
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  session_id UUID,
  user_id UUID,
  video_id UUID,
  event_type VARCHAR(50),
  event_data JSONB,
  timestamp TIMESTAMP
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  room_id VARCHAR(100),
  user_id UUID,
  message TEXT,
  timestamp TIMESTAMP
);
```

## API Standards

### Request/Response Format

All APIs follow consistent patterns:

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00Z"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Authentication

JWT-based authentication with Bearer tokens:
```
Authorization: Bearer <token>
```

### Rate Limiting

Headers indicate rate limit status:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## Development Configuration

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/video_platform

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Services
STREAMING_SERVICE_URL=http://localhost:3001
ANALYTICS_SERVICE_URL=http://localhost:3002
CHAT_SERVICE_URL=http://localhost:3003

# Storage
STORAGE_TYPE=local # local | s3
STORAGE_PATH=./storage

# CDN Simulation
CDN_CACHE_TTL=3600
CDN_EDGE_LOCATIONS=us-east,us-west,eu-west,ap-south
```

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: video_platform
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  streaming:
    build: ./services/streaming
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  analytics:
    build: ./services/analytics
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - redis

  chat:
    build: ./services/chat
    ports:
      - "3003:3003"
    depends_on:
      - redis
```

## Testing Strategy

### Test Scenarios

1. **Load Testing**: Simulate thousands of concurrent viewers
2. **Network Conditions**: Test various bandwidth scenarios
3. **Error Scenarios**: Server failures, network interruptions
4. **Geographic Distribution**: Multi-region access patterns
5. **Device Diversity**: Different player types requesting content
6. **Live Events**: Spike traffic during stream start

### Test Data

Pre-generated test content:
- Sample videos in multiple qualities (360p to 4K)
- HLS and DASH manifests
- Subtitle files in multiple languages
- Thumbnail sprites
- DRM licenses

## Deployment Options

### Development
- Docker Compose for local development
- Hot reloading for all services
- Shared volumes for test content

### Production
- **Vercel**: Frontend and serverless functions
- **Railway/Render**: Backend services
- **Supabase/Neon**: PostgreSQL database
- **Upstash**: Redis for caching
- **Cloudflare R2**: Object storage for video files

## Integration with Player Project

The player project will integrate with these services through:

1. **Environment Configuration**: Point to service endpoints
2. **API Clients**: TypeScript SDK for service communication
3. **Mock Mode**: Ability to run without backend for demos
4. **Feature Flags**: Toggle service dependencies

```typescript
// Example player configuration
const playerConfig = {
  services: {
    streaming: process.env.NEXT_PUBLIC_STREAMING_URL,
    analytics: process.env.NEXT_PUBLIC_ANALYTICS_URL,
    chat: process.env.NEXT_PUBLIC_CHAT_URL,
    drm: process.env.NEXT_PUBLIC_DRM_URL
  },
  mockMode: process.env.NODE_ENV === 'development',
  features: {
    analytics: true,
    chat: true,
    drm: false
  }
};
```

This architecture provides a comprehensive backend infrastructure for testing all aspects of video streaming, from content delivery to real-time features, while remaining deployable and maintainable as a portfolio project.