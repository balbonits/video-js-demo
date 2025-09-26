# Streaming Service

A production-ready video streaming service that handles HLS/DASH adaptive bitrate streaming, video transcoding, and content delivery.

## Features

- **Multi-format Support**: Upload videos in MP4, MKV, AVI, MOV, WebM formats
- **Adaptive Bitrate Streaming**: Automatic HLS and DASH manifest generation
- **Video Transcoding**: Multiple quality profiles (360p, 480p, 720p, 1080p, 4K)
- **Thumbnail Generation**: Automatic thumbnail extraction at key frames
- **Preview Generation**: 30-second preview clips
- **Storage Integration**: MinIO/S3 compatible object storage
- **Job Queue**: Asynchronous processing with BullMQ
- **Caching**: Redis caching for manifests and metadata
- **Metrics**: Prometheus metrics for monitoring
- **Security**: JWT authentication, rate limiting, CORS

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Gateway │────▶│   Express   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
              ┌─────▼─────┐            ┌──────▼──────┐           ┌───────▼───────┐
              │ PostgreSQL │            │    Redis    │           │     MinIO     │
              └───────────┘            └─────────────┘           └───────────────┘
                                               │
                                        ┌──────▼──────┐
                                        │   BullMQ    │
                                        └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │   FFmpeg    │
                                        └─────────────┘
```

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start dependencies
docker-compose up -d postgres redis minio

# Run database migrations
npm run migrate:up

# Start development server
npm run dev
```

### Production

```bash
# Build the application
npm run build

# Start with Docker Compose
docker-compose up -d

# Or deploy to Kubernetes
kubectl apply -f k8s/
```

## API Documentation

### Video Upload

```http
POST /api/videos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- video: <file>
- title: string (optional)
- description: string (optional)
```

Response:
```json
{
  "videoId": "uuid",
  "message": "Video uploaded successfully",
  "metadata": {
    "duration": 120.5,
    "format": "mp4",
    "width": 1920,
    "height": 1080,
    "bitrate": 5000000,
    "fps": 30,
    "codec": "h264"
  }
}
```

### Start Transcoding

```http
POST /api/videos/:id/transcode
Authorization: Bearer <token>
Content-Type: application/json

{
  "profiles": ["720p", "480p", "360p"],
  "generateHLS": true,
  "generateDASH": false,
  "generateThumbnails": true
}
```

### Stream Video (HLS)

```http
GET /api/stream/:id/hls/playlist.m3u8
```

Returns the HLS master playlist for adaptive bitrate streaming.

### Stream Video (DASH)

```http
GET /api/stream/:id/dash/manifest.mpd
```

Returns the DASH manifest for adaptive bitrate streaming.

### Get Job Status

```http
GET /api/jobs/:id
Authorization: Bearer <token>
```

## Video Processing Pipeline

1. **Upload**: Video uploaded to temporary storage
2. **Metadata Extraction**: FFprobe extracts video information
3. **Storage**: Original file moved to object storage
4. **Queue Job**: Transcoding job added to BullMQ
5. **Transcoding**: FFmpeg processes video into multiple qualities
6. **Segmentation**: Generate HLS/DASH segments
7. **Thumbnail Generation**: Extract key frame thumbnails
8. **Preview Generation**: Create 30-second preview clip
9. **CDN Distribution**: Files distributed to CDN endpoints

## Configuration

### Transcoding Profiles

```javascript
{
  '360p': {
    resolution: '640x360',
    videoBitrate: '800k',
    audioBitrate: '96k'
  },
  '480p': {
    resolution: '854x480',
    videoBitrate: '1400k',
    audioBitrate: '128k'
  },
  '720p': {
    resolution: '1280x720',
    videoBitrate: '2800k',
    audioBitrate: '128k'
  },
  '1080p': {
    resolution: '1920x1080',
    videoBitrate: '5000k',
    audioBitrate: '192k'
  }
}
```

### HLS Settings

- Segment Duration: 10 seconds
- Playlist Size: 5 segments
- Delete Segments: Enabled for live streaming

### DASH Settings

- Segment Duration: 4 seconds
- Use Timeline: Enabled
- Use Template: Enabled

## Performance Optimization

### Caching Strategy

- **Redis Cache**: Manifests cached for 1 hour
- **CDN Cache**: Segments cached for 1 year
- **Metadata Cache**: Video metadata cached for 24 hours

### Scaling Considerations

- **Horizontal Scaling**: Multiple API instances behind load balancer
- **Queue Workers**: Scale transcoding workers based on load
- **Database Pooling**: Connection pooling for PostgreSQL
- **Storage Sharding**: Distribute videos across multiple buckets

## Monitoring

### Prometheus Metrics

- `streaming_service_http_requests_total`: Total HTTP requests
- `streaming_service_http_request_duration_seconds`: Request latency
- `streaming_service_active_transcoding_jobs`: Current transcoding jobs
- `streaming_service_videos_uploaded_total`: Total videos uploaded
- `streaming_service_bandwidth_bytes_total`: Bandwidth served
- `streaming_service_transcoding_duration_seconds`: Transcoding time

### Health Checks

- `/health`: Service health status
- `/metrics`: Prometheus metrics endpoint

## Security

### Authentication

- JWT-based authentication
- Token validation on protected endpoints
- Role-based access control

### Rate Limiting

- General API: 100 requests per 15 minutes
- Upload: 10 uploads per 15 minutes
- Streaming: 1000 requests per minute

### CORS Configuration

- Configurable allowed origins
- Credentials support
- Custom headers for range requests

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure FFmpeg is installed in the container
2. **Storage connection failed**: Check MinIO/S3 credentials
3. **Database migration failed**: Verify PostgreSQL connection
4. **Queue processing stuck**: Check Redis connection and worker logs

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# View worker logs
docker-compose logs -f streaming-service
```

## Development

### Project Structure

```
streaming-service/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── migrations/         # Database migrations
├── tests/             # Test files
├── docker-compose.yml  # Docker configuration
└── Dockerfile         # Container definition
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API documentation
4. Run linting before commit
5. Use conventional commits

## License

MIT