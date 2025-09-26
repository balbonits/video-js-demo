import { Kafka, Consumer, Producer } from 'kafkajs';
import { config } from './index';
import { logger } from '../utils/logger';

let kafka: Kafka;
let producer: Producer;
let consumer: Consumer;

export async function initializeKafka(): Promise<void> {
  try {
    kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
    });

    producer = kafka.producer();
    await producer.connect();

    consumer = kafka.consumer({ groupId: config.kafka.groupId });
    await consumer.connect();

    // Subscribe to topics
    for (const topic of config.kafka.topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    logger.info('Kafka initialized');
  } catch (error) {
    logger.error('Kafka initialization failed:', error);
    throw error;
  }
}

export function getKafkaProducer(): Producer {
  if (!producer) {
    throw new Error('Kafka producer not initialized');
  }
  return producer;
}

export function getKafkaConsumer(): Consumer {
  if (!consumer) {
    throw new Error('Kafka consumer not initialized');
  }
  return consumer;
}