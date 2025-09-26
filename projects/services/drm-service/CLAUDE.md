# DRM Service

Digital Rights Management service for secure content delivery with token generation, validation, and license management.

## Features

- **Token Generation**: Secure JWT tokens for content access
- **License Management**: Widevine, FairPlay, and PlayReady support
- **Key Management**: Secure key storage and rotation
- **Access Control**: User-based content restrictions
- **Geo-blocking**: Regional content restrictions
- **Device Limits**: Concurrent stream limitations
- **Watermarking**: Dynamic watermark injection
- **Analytics**: DRM usage tracking and reporting

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ DRM Service │────▶│ License     │
│   Player    │     │    (API)    │     │  Servers    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┼──────┐
                    │             │
              ┌─────▼─────┐ ┌────▼────┐
              │ PostgreSQL │ │  Redis  │
              │  (Keys)    │ │ (Cache) │
              └───────────┘ └─────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start dependencies
docker-compose up -d postgres redis

# Run migrations
npm run migrate:up

# Start development server
npm run dev
```

## API Documentation

### Generate Token

```http
POST /api/tokens/generate
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "user_id": "user_123",
  "content_id": "video_456",
  "duration": 3600,
  "restrictions": {
    "max_streams": 3,
    "geo_regions": ["US", "CA"],
    "device_types": ["web", "mobile"]
  }
}
```

Response:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_at": "2024-01-01T12:00:00Z",
  "license_url": "https://drm.example.com/license/widevine"
}
```

### Validate Token

```http
POST /api/tokens/validate
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "content_id": "video_456",
  "device_id": "device_789"
}
```

### Get License

```http
POST /api/license/:provider
Content-Type: application/octet-stream

[Binary license request data]
```

## DRM Providers

### Widevine

```javascript
const widevineConfig = {
  server_url: 'https://drm.example.com/license/widevine',
  headers: {
    'X-DRM-Token': token
  }
};
```

### FairPlay

```javascript
const fairplayConfig = {
  certificate_url: 'https://drm.example.com/certificate',
  license_url: 'https://drm.example.com/license/fairplay',
  headers: {
    'X-DRM-Token': token
  }
};
```

### PlayReady

```javascript
const playreadyConfig = {
  license_url: 'https://drm.example.com/license/playready',
  custom_data: token
};
```

## Security Configuration

### Token Structure

```javascript
{
  // Header
  "alg": "RS256",
  "typ": "JWT",

  // Payload
  "sub": "user_123",
  "cid": "video_456",
  "exp": 1234567890,
  "iat": 1234567800,
  "restrictions": {
    "max_streams": 3,
    "geo_regions": ["US", "CA"],
    "device_types": ["web", "mobile"],
    "hdcp_required": true,
    "offline_playback": false
  },
  "fingerprint": "unique_session_id"
}
```

### Key Rotation

```bash
# Generate new key pair
npm run generate-keys

# Rotate keys
npm run rotate-keys

# Export public key
npm run export-public-key
```

## Content Protection Levels

### Level 1: Basic
- Token-based authentication
- Time-limited access
- Basic device verification

### Level 2: Standard
- Hardware DRM support
- HDCP enforcement
- Concurrent stream limits

### Level 3: Premium
- Forensic watermarking
- Advanced geo-blocking
- Real-time piracy detection

## Database Schema

```sql
-- Content keys table
CREATE TABLE content_keys (
  id UUID PRIMARY KEY,
  content_id VARCHAR(255),
  key_id VARCHAR(255),
  key_value TEXT,
  provider VARCHAR(50),
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Access tokens table
CREATE TABLE access_tokens (
  id UUID PRIMARY KEY,
  token_hash VARCHAR(255),
  user_id VARCHAR(255),
  content_id VARCHAR(255),
  device_id VARCHAR(255),
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false
);

-- License requests table
CREATE TABLE license_requests (
  id UUID PRIMARY KEY,
  token_id UUID,
  provider VARCHAR(50),
  device_info JSONB,
  ip_address INET,
  created_at TIMESTAMP
);
```

## Configuration

```env
# Server
PORT=3005
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://drm_user:pass@localhost:5432/drm_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_PRIVATE_KEY=path/to/private.key
JWT_PUBLIC_KEY=path/to/public.key
API_KEY_SALT=random_salt_value

# DRM Providers
WIDEVINE_SERVER_URL=https://license.widevine.com
FAIRPLAY_CERTIFICATE_URL=https://certificate.example.com
PLAYREADY_LICENSE_URL=https://playready.example.com

# Features
ENABLE_GEO_BLOCKING=true
ENABLE_WATERMARKING=false
MAX_CONCURRENT_STREAMS=3
TOKEN_EXPIRY_HOURS=6
```

## Monitoring

### Metrics

- Token generation rate
- License requests per second
- Token validation success rate
- Geographic distribution
- Device type breakdown
- Piracy detection alerts

### Alerts

- Suspicious access patterns
- Token reuse attempts
- Geographic anomalies
- Rate limit violations

## Integration Examples

### Video.js

```javascript
player.ready(() => {
  player.eme();
  player.src({
    src: 'https://cdn.example.com/video.mpd',
    type: 'application/dash+xml',
    keySystems: {
      'com.widevine.alpha': {
        url: 'https://drm.example.com/license/widevine',
        headers: {
          'X-DRM-Token': drmToken
        }
      }
    }
  });
});
```

### Shaka Player

```javascript
const player = new shaka.Player(videoElement);

player.configure({
  drm: {
    servers: {
      'com.widevine.alpha': 'https://drm.example.com/license/widevine'
    },
    advanced: {
      'com.widevine.alpha': {
        'headers': {
          'X-DRM-Token': drmToken
        }
      }
    }
  }
});
```

## Deployment

```bash
# Build Docker image
docker build -t drm-service .

# Run with Docker Compose
docker-compose up -d

# Deploy to Kubernetes
kubectl apply -f k8s/
```

## Troubleshooting

### Common Issues

1. **License request failed**: Check token validity and content key availability
2. **HDCP not supported**: Verify device capabilities and content protection level
3. **Geographic restriction**: Validate IP geolocation and allowed regions
4. **Token expired**: Generate new token with appropriate expiry time

## License

MIT