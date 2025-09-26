import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';
import { initializeRedis } from './config/redis';
import { DRMService } from './services/drmService';
import { setupRoutes } from './routes';
import { setupMetrics } from './utils/metrics';

dotenv.config();

const fastify = Fastify({
  logger: false,
  trustProxy: true,
});

async function startServer() {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    });

    await fastify.register(helmet, {
      contentSecurityPolicy: false,
    });

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET!,
    });

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    // Initialize services
    await initializeDatabase();
    logger.info('Database initialized');

    await initializeRedis();
    logger.info('Redis initialized');

    const drmService = new DRMService();
    await drmService.initialize();
    logger.info('DRM service initialized');

    // Setup routes
    setupRoutes(fastify, drmService);

    // Setup metrics
    if (process.env.METRICS_ENABLED === 'true') {
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
    const port = parseInt(process.env.PORT || '3005');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    logger.info(`DRM service running on http://${host}:${port}`);
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

startServer();