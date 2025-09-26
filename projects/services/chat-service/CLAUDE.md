# Chat Service

Real-time WebSocket-based chat service with room management, moderation, and message history.

## Features

- **Real-time Messaging**: WebSocket-based instant messaging
- **Room Management**: Create and join chat rooms for videos/streams
- **User Presence**: Track online users and typing indicators
- **Message History**: Persistent message storage with pagination
- **Moderation**: Message filtering, user blocking, and moderation tools
- **Reactions**: Emoji reactions and mentions
- **Rate Limiting**: Prevent spam and abuse
- **Encryption**: End-to-end encryption support for private messages

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

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WebSocket  │────▶│  Socket.io  │────▶│    Redis    │
│   Clients   │     │   Server    │     │   Pub/Sub   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┼──────┐
                    │             │
              ┌─────▼─────┐ ┌────▼────┐
              │ PostgreSQL │ │  Cache  │
              └───────────┘ └─────────┘
```

## WebSocket Events

### Client → Server

```javascript
// Join room
socket.emit('join_room', {
  room_id: 'video_123',
  user_token: 'jwt_token'
});

// Send message
socket.emit('send_message', {
  room_id: 'video_123',
  content: 'Hello world!',
  type: 'text'
});

// Typing indicator
socket.emit('typing', {
  room_id: 'video_123',
  is_typing: true
});

// React to message
socket.emit('react', {
  message_id: 'msg_456',
  reaction: '👍'
});
```

### Server → Client

```javascript
// New message
socket.on('new_message', (data) => {
  // data: { message_id, user, content, timestamp, reactions }
});

// User joined
socket.on('user_joined', (data) => {
  // data: { user_id, username, avatar }
});

// Typing indicator
socket.on('user_typing', (data) => {
  // data: { user_id, username, is_typing }
});

// Room stats
socket.on('room_stats', (data) => {
  // data: { online_users, message_count }
});
```

## API Endpoints

### REST API

```http
# Get room history
GET /api/rooms/:roomId/messages?page=1&limit=50

# Get room members
GET /api/rooms/:roomId/members

# Create room
POST /api/rooms

# Ban user
POST /api/rooms/:roomId/ban

# Report message
POST /api/messages/:messageId/report
```

## Database Schema

```sql
-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  room_id VARCHAR(255),
  user_id VARCHAR(255),
  content TEXT,
  type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Rooms table
CREATE TABLE rooms (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50),
  settings JSONB,
  created_at TIMESTAMP
);

-- User presence
CREATE TABLE presence (
  user_id VARCHAR(255),
  room_id VARCHAR(255),
  socket_id VARCHAR(255),
  last_seen TIMESTAMP,
  PRIMARY KEY (user_id, room_id)
);
```

## Security

- JWT authentication for WebSocket connections
- Message content sanitization (XSS prevention)
- Rate limiting per user/IP
- Profanity filtering
- Spam detection
- User blocking system
- Admin moderation tools

## Configuration

```env
# Server
PORT=3004
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://chat_user:pass@localhost:5432/chat_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-secret-key
RATE_LIMIT_MESSAGES=10
RATE_LIMIT_WINDOW=60000

# Features
ENABLE_PROFANITY_FILTER=true
ENABLE_SPAM_DETECTION=true
MAX_MESSAGE_LENGTH=1000
MESSAGE_HISTORY_LIMIT=100
```

## Deployment

```bash
# Build Docker image
docker build -t chat-service .

# Run with Docker Compose
docker-compose up -d

# Scale horizontally
docker-compose up -d --scale chat-service=3
```

## Monitoring

- Active connections count
- Messages per second
- Average latency
- Error rate
- Room statistics

## License

MIT