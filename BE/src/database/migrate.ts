import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../config/logger';
import { initialMigration } from './migrations/001_initial';

const MIGRATION_COLLECTION = 'schemaMigrations';

async function migrate(): Promise<void> {
  await connectDatabase();

  const db = (await import('mongoose')).default.connection.db;
  if (db === undefined) {
    throw new Error('MongoDB connection is not ready');
  }

  const applied = db.collection(MIGRATION_COLLECTION);
  await applied.createIndex({ id: 1 }, { unique: true });

  const migrations = [initialMigration];

  for (const migration of migrations) {
    const existing = await applied.findOne({ id: migration.id });
    if (existing) {
      logger.info('Migration already applied', { id: migration.id });
      continue;
    }

    logger.info('Applying migration', { id: migration.id });
    await migration.up(db);
    await applied.insertOne({ id: migration.id, appliedAt: new Date() });
    logger.info('Migration applied', { id: migration.id });
  }
}

void migrate()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown migration error';
    logger.error('Migration failed', { message });
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  });
