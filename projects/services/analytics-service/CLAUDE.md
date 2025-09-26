# Analytics Service

Real-time analytics service for video streaming platform with event collection, aggregation, and dashboard support.

## Features

- **Real-time Event Processing**: Kafka-based event streaming
- **Time-series Storage**: ClickHouse for efficient analytics queries
- **Real-time Dashboards**: WebSocket-based live metrics
- **Video Analytics**: Views, watch time, completion rates
- **User Engagement**: Tracking user behavior and preferences
- **System Monitoring**: Performance metrics and health checks
- **Custom Aggregations**: Flexible metric calculations
- **Data Retention**: Automatic cleanup of old data

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Events    │────▶│    Kafka    │────▶│  Processor  │
│   Source    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
              ┌─────▼─────┐           ┌──────▼──────┐          ┌───────▼───────┐
              │ClickHouse │           │  PostgreSQL │          │     Redis     │
              │(Analytics)│           │  (Metadata) │          │    (Cache)    │
              └───────────┘           └─────────────┘          └───────────────┘
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                                        ┌─────▼─────┐
                                        │ Dashboard │
                                        │(WebSocket)│
                                        └───────────┘
```

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start dependencies
docker-compose up -d

# Run service
npm run dev
```

## Event Types

### Video Events

```javascript
{
  "event_type": "video_start",
  "user_id": "user_123",
  "session_id": "session_456",
  "video_id": "video_789",
  "properties": {
    "quality": "720p",
    "device_type": "desktop",
    "browser": "chrome"
  }
}
```

### Supported Events

- `video_start`: Video playback initiated
- `video_progress`: Playback progress update
- `video_pause`: Video paused
- `video_resume`: Video resumed
- `video_complete`: Video finished
- `video_error`: Playback error occurred
- `video_buffer`: Buffering event
- `quality_change`: Quality switched
- `seek`: User seeked in video

## API Endpoints

### Track Event

```http
POST /api/events
Content-Type: application/json

{
  "event_type": "video_start",
  "user_id": "user_123",
  "video_id": "video_456",
  "properties": {}
}
```

### Get Video Metrics

```http
GET /api/metrics/video/:videoId?startDate=2024-01-01&endDate=2024-01-31
```

Response:
```json
{
  "video_id": "video_456",
  "views": 1234,
  "unique_viewers": 890,
  "watch_time_seconds": 456789,
  "avg_watch_percentage": 67.5,
  "completion_rate": 0.45,
  "engagement_score": 8.2
}
```

### Real-time Metrics

```http
GET /api/metrics/realtime
```

Response:
```json
{
  "concurrent_viewers": 5678,
  "active_streams": 234,
  "bandwidth_gbps": 12.5,
  "events_per_second": 1500,
  "error_rate": 0.002
}
```

## WebSocket Integration

### Connect to Dashboard

```javascript
const ws = new WebSocket('ws://localhost:3002/ws');

ws.on('message', (data) => {
  const { type, payload } = JSON.parse(data);

  switch(type) {
    case 'realtime_metrics':
      updateDashboard(payload);
      break;
    case 'analytics_event':
      handleEvent(payload);
      break;
  }
});
```

## ClickHouse Schema

### Events Table

```sql
CREATE TABLE events (
  event_id UUID,
  event_type String,
  user_id Nullable(String),
  session_id Nullable(String),
  video_id Nullable(String),
  timestamp DateTime,
  properties String,
  metadata Nullable(String)
) ENGINE = MergeTree()
ORDER BY (event_type, timestamp)
PARTITION BY toYYYYMM(timestamp)
```

### Aggregated Metrics

```sql
CREATE TABLE video_metrics (
  video_id String,
  date Date,
  views UInt32,
  unique_viewers UInt32,
  watch_time_seconds Float64,
  avg_watch_percentage Float32,
  completion_rate Float32
) ENGINE = SummingMergeTree()
ORDER BY (video_id, date)
```

## Configuration

### Event Processing

- Kafka consumer group for scalability
- Batch processing for efficiency
- Dead letter queue for failed events
- Automatic retry with exponential backoff

### Data Aggregation

- Hourly video metrics aggregation
- Daily user engagement calculation
- Real-time metrics with 1-minute window
- Automatic data retention (90 days default)

## Monitoring

### Prometheus Metrics

- `analytics_service_events_processed_total`: Total events processed
- `analytics_service_event_processing_duration_seconds`: Processing time
- `analytics_service_websocket_connections`: Active WebSocket connections
- `analytics_service_kafka_consumer_lag`: Kafka consumer lag

### Health Checks

```http
GET /health
GET /api/metrics/health
```

## Deployment

### Docker

```bash
docker build -t analytics-service .
docker run -p 3002:3002 analytics-service
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: analytics-service
  template:
    metadata:
      labels:
        app: analytics-service
    spec:
      containers:
      - name: analytics-service
        image: analytics-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: KAFKA_BROKERS
          value: "kafka:9092"
        - name: CLICKHOUSE_HOST
          value: "clickhouse"
```

## Performance Optimization

### Query Optimization

- Pre-aggregated materialized views
- Proper partitioning by date
- Efficient indexing strategies
- Query result caching

### Scaling Strategies

- Horizontal scaling of consumers
- ClickHouse cluster for large datasets
- Redis cluster for caching
- Load balancing for API endpoints

## Troubleshooting

### Common Issues

1. **High Kafka lag**: Scale up consumers or optimize processing
2. **Slow queries**: Check ClickHouse partitioning and indexes
3. **Memory issues**: Adjust batch sizes and cache limits
4. **WebSocket disconnections**: Check network and scaling

### Debug Mode

```bash
LOG_LEVEL=debug npm run dev
```

## License

MIT