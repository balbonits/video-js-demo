import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';
import { initializeClickHouse } from './config/clickhouse';
import { initializeRedis } from './config/redis';
import { initializeKafka } from './config/kafka';
import { setupRoutes } from './routes';
import { startEventProcessor } from './workers/eventProcessor';
import { startAggregator } from './workers/aggregator';
import { setupMetrics } from './utils/metrics';
import { WebSocketService } from './services/websocketService';

const fastify = Fastify({
  logger: false,
  trustProxy: true,
});

async function startServer() {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: config.security.corsOrigin,
      credentials: true,
    });

    await fastify.register(helmet, {
      contentSecurityPolicy: false,
    });

    await fastify.register(compress);

    await fastify.register(jwt, {
      secret: config.security.jwtSecret,
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '15 minutes',
    });

    await fastify.register(websocket, {
      options: {
        maxPayload: 1048576, // 1MB
        path: config.websocket.path,
      },
    });

    // Initialize databases
    await initializeDatabase();
    logger.info('PostgreSQL initialized');

    await initializeClickHouse();
    logger.info('ClickHouse initialized');

    await initializeRedis();
    logger.info('Redis initialized');

    await initializeKafka();
    logger.info('Kafka initialized');

    // Setup routes
    setupRoutes(fastify);

    // Initialize WebSocket service
    const wsService = new WebSocketService(fastify);
    await wsService.initialize();

    // Start background workers
    startEventProcessor();
    logger.info('Event processor started');

    startAggregator();
    logger.info('Aggregator started');

    // Setup metrics endpoint
    if (config.metrics.enabled) {
      setupMetrics(fastify);
    }

    // Health check
    fastify.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // Start server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(`Analytics service running on http://${config.server.host}:${config.server.port}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
  process.exit(1);
});

// Start the server
startServer();