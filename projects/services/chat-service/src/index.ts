import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { ChatService } from './services/chatService';
import { setupSocketHandlers } from './services/socketHandlers';
import { authMiddleware } from './middleware/auth';
import { setupRoutes } from './routes';

dotenv.config();

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
  });
});

// Setup REST API routes
setupRoutes(app);

// Initialize services
async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized');

    await initializeRedis();
    logger.info('Redis initialized');

    const chatService = new ChatService(io);
    await chatService.initialize();

    // Setup Socket.IO handlers
    setupSocketHandlers(io, chatService);

    const port = process.env.PORT || 3004;
    const host = process.env.HOST || '0.0.0.0';

    server.listen(Number(port), host, () => {
      logger.info(`Chat service running on http://${host}:${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();