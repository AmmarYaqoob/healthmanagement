import mongoose from 'mongoose';
import { config } from './env';
import { logger } from './logger';

const SERVER_SELECTION_TIMEOUT_MS = 5000;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.listenerCount('error') === 0) {
    mongoose.connection.on('error', (error: Error) => {
      logger.error('MongoDB connection error', { message: error.message });
    });
  }

  try {
    await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    });
    logger.info('Connected to MongoDB');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    logger.error('Failed to connect to MongoDB', { message });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}
