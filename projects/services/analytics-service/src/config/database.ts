import knex, { Knex } from 'knex';
import { config } from './index';
import { logger } from '../utils/logger';

let db: Knex;

export async function initializeDatabase(): Promise<Knex> {
  try {
    db = knex({
      client: 'pg',
      connection: config.database.url,
      pool: {
        min: config.database.pool.min,
        max: config.database.pool.max,
      },
    });

    // Test connection
    await db.raw('SELECT 1');

    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}