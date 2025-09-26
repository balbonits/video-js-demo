# Backend Services

Production-ready microservices for video streaming platform.

## Services Overview

### 1. Streaming Service (Port 3001)
- **Purpose**: HLS/DASH adaptive bitrate streaming and video transcoding
- **Tech Stack**: Node.js, TypeScript, Express, FFmpeg, BullMQ
- **Storage**: MinIO/S3, PostgreSQL, Redis
- **Features**:
  - Multi-format video upload (MP4, MKV, AVI, MOV, WebM)
  - Automatic transcoding to multiple qualities (360p-4K)
  - HLS and DASH manifest generation
  - Thumbnail and preview generation
  - CDN integration

### 2. Analytics Service (Port 3002)
- **Purpose**: Real-time analytics and metrics collection
- **Tech Stack**: Node.js, TypeScript, Fastify, ClickHouse, Kafka
- **Storage**: ClickHouse, PostgreSQL, Redis
- **Features**:
  - Real-time event processing via Kafka
  - Video analytics (views, watch time, completion rates)
  - User engagement tracking
  - WebSocket dashboard updates
  - Time-series data aggregation

### 3. Chat Service (Port 3004)
- **Purpose**: Real-time WebSocket chat for videos/streams
- **Tech Stack**: Node.js, TypeScript, Express, Socket.io
- **Storage**: PostgreSQL, Redis
- **Features**:
  - Real-time messaging with rooms
  - User presence and typing indicators
  - Message history and reactions
  - Moderation and spam protection
  - Rate limiting

### 4. DRM Service (Port 3005)
- **Purpose**: Digital Rights Management and content protection
- **Tech Stack**: Node.js, TypeScript, Fastify, JWT
- **Storage**: PostgreSQL, Redis
- **Features**:
  - JWT token generation for content access
  - Widevine, FairPlay, PlayReady support
  - Content key management
  - Geo-blocking and device restrictions
  - License server integration

## Quick Start All Services

```bash
# Clone and setup
cd /workspaces/video-js-demo-wiki/projects/services

# Start all services with Docker Compose
docker-compose up -d

# Or start individually
cd streaming-service && docker-compose up -d
cd analytics-service && docker-compose up -d
cd chat-service && docker-compose up -d
cd drm-service && docker-compose up -d
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
└─────────────────────────────────────────────────────────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
┌───▼────┐          ┌──────▼──────┐         ┌──────▼──────┐
│Streaming│          │  Analytics  │         │    Chat     │
│ Service │          │   Service   │         │   Service   │
│  :3001  │          │    :3002    │         │    :3004    │
└────┬────┘          └──────┬──────┘         └──────┬──────┘
     │                      │                        │
     │              ┌──────▼──────┐                 │
     │              │     DRM      │                 │
     │              │   Service    │                 │
     │              │    :3005     │                 │
     │              └──────────────┘                 │
     │                                               │
┌────▼────────────────────────────────────────────────▼────┐
│                    Shared Infrastructure                  │
├────────────────────────────────────────────────────────────┤
│ PostgreSQL │ Redis │ ClickHouse │ Kafka │ MinIO │ CDN    │
└────────────────────────────────────────────────────────────┘
```

## Service Communication

### REST APIs
- All services expose REST APIs for synchronous communication
- JWT authentication for secure endpoints
- Rate limiting and CORS protection

### Message Queue (Kafka)
- Analytics service consumes events from all other services
- Asynchronous event processing
- Scalable event streaming

### WebSocket
- Chat service: Real-time messaging
- Analytics service: Live dashboard updates

### Shared Cache (Redis)
- Session management
- Rate limiting
- Temporary data storage
- Pub/Sub messaging

## Configuration

Each service has its own `.env.example` file with required environment variables:

```bash
# Common variables across services
NODE_ENV=production
JWT_SECRET=shared-secret-key
REDIS_HOST=redis
DATABASE_URL=postgresql://user:pass@postgres:5432/db

# Service-specific configurations
# See individual service directories
```

## Deployment

### Docker Compose (Development/Testing)

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale streaming-service=3
```

### Kubernetes (Production)

```yaml
# Example deployment for streaming service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: streaming-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: streaming-service
  template:
    metadata:
      labels:
        app: streaming-service
    spec:
      containers:
      - name: streaming-service
        image: streaming-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
```

## Monitoring

### Health Endpoints
- `GET /health` - Service health check (all services)
- `GET /metrics` - Prometheus metrics (all services)

### Metrics Collection
All services export Prometheus metrics on their metrics port:
- Streaming: `:9090/metrics`
- Analytics: `:9091/metrics`
- Chat: `:9092/metrics`
- DRM: `:9093/metrics`

### Logging
- Structured JSON logging with Winston
- Log aggregation with ELK stack recommended
- Error tracking with Sentry (optional)

## Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key authentication for service-to-service

### Data Protection
- TLS/SSL for all communications
- Encryption at rest for sensitive data
- DRM for content protection

### Rate Limiting
- Per-user rate limits
- IP-based rate limiting
- Adaptive rate limiting based on load

## Testing

```bash
# Run tests for all services
npm test

# Run tests with coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

## Performance Optimization

### Caching Strategy
- Redis for hot data
- CDN for static content
- Query result caching

### Database Optimization
- Connection pooling
- Query optimization
- Proper indexing
- Read replicas for scaling

### Horizontal Scaling
- All services are stateless and horizontally scalable
- Load balancing with health checks
- Auto-scaling based on metrics

## Troubleshooting

### Common Issues

1. **Service won't start**
   - Check database connections
   - Verify Redis is running
   - Check port availability

2. **High latency**
   - Check database query performance
   - Monitor Redis memory usage
   - Review service logs for errors

3. **Memory issues**
   - Adjust Node.js heap size
   - Check for memory leaks
   - Review batch processing sizes

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# View service logs
docker-compose logs -f [service-name]

# Connect to service container
docker exec -it [container-name] sh
```

## Contributing

1. Follow the existing code structure
2. Write tests for new features
3. Update documentation
4. Use conventional commits
5. Run linting before committing

## License

MIT