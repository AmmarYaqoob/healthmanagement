import { connectDatabase, disconnectDatabase } from '../config/database';
import { logger } from '../config/logger';
import { initialMigration } from './migrations/001_initial';
import { clinicsMigration } from './migrations/002_clinics';
import { appointmentsMigration } from './migrations/003_appointments';
import { practitionerEmailMigration } from './migrations/004_practitioner_email';
import { accessLogMigration } from './migrations/005_access_log';

const MIGRATION_COLLECTION = 'schemaMigrations';

async function migrate(): Promise<void> {
  await connectDatabase();

  const db = (await import('mongoose')).default.connection.db;
  if (db === undefined) {
    throw new Error('MongoDB connection is not ready');
  }

  const applied = db.collection(MIGRATION_COLLECTION);
  await applied.createIndex({ id: 1 }, { unique: true });

  const migrations = [
    initialMigration,
    clinicsMigration,
    appointmentsMigration,
    practitionerEmailMigration,
    accessLogMigration,
  ];

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
