import { getKafkaConsumer } from '../config/kafka';
import { analyticsService } from '../services/analyticsService';
import { eventsProcessed, eventProcessingDuration } from '../utils/metrics';
import { logger } from '../utils/logger';

export async function startEventProcessor() {
  const consumer = getKafkaConsumer();

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const startTime = Date.now();

      try {
        const event = JSON.parse(message.value?.toString() || '{}');

        // Process event
        await analyticsService.trackEvent({
          ...event,
          timestamp: new Date(),
        });

        // Update metrics
        eventsProcessed.inc({ event_type: event.event_type });
        eventProcessingDuration.observe(
          { event_type: event.event_type },
          (Date.now() - startTime) / 1000
        );
      } catch (error) {
        logger.error('Failed to process event:', error);
      }
    },
  });

  logger.info('Event processor started');
}