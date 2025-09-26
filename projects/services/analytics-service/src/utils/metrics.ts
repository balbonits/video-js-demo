import { FastifyInstance } from 'fastify';
import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

collectDefaultMetrics({ prefix: 'analytics_service_' });

export const eventsProcessed = new Counter({
  name: 'analytics_service_events_processed_total',
  help: 'Total number of events processed',
  labelNames: ['event_type'],
});

export const eventProcessingDuration = new Histogram({
  name: 'analytics_service_event_processing_duration_seconds',
  help: 'Duration of event processing',
  labelNames: ['event_type'],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5],
});

export const activeConnections = new Gauge({
  name: 'analytics_service_websocket_connections',
  help: 'Number of active WebSocket connections',
});

export const kafkaLag = new Gauge({
  name: 'analytics_service_kafka_consumer_lag',
  help: 'Kafka consumer lag',
  labelNames: ['topic', 'partition'],
});

export function setupMetrics(fastify: FastifyInstance) {
  fastify.get('/metrics', async (request, reply) => {
    reply.type('text/plain');
    return await register.metrics();
  });
}