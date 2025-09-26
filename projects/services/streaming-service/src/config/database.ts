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
      migrations: {
        directory: './migrations',
        tableName: 'knex_migrations',
      },
    });

    // Test connection
    await db.raw('SELECT 1');

    // Run migrations
    await db.migrate.latest();

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

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
  }
}