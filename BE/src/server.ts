import { createServer, type Server } from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { config } from './config/env';
import { logger } from './config/logger';

const SHUTDOWN_TIMEOUT_MS = 10_000;

function listen(server: Server, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function shutdown(server: Server, signal: NodeJS.Signals): void {
  logger.info(`Received ${signal}. Shutting down.`);

  const forceExit = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  server.close((closeError) => {
    void (async () => {
      if (closeError) {
        logger.error('Error while closing the HTTP server', { message: closeError.message });
        process.exit(1);
      }

      try {
        await disconnectDatabase();
        clearTimeout(forceExit);
        process.exit(0);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown shutdown error';
        logger.error('Error while disconnecting from MongoDB', { message });
        process.exit(1);
      }
    })();
  });
}

async function main(): Promise<void> {
  const { port, nodeEnv } = config;

  await connectDatabase();

  const server = createServer(createApp());

  try {
    await listen(server, port);
  } catch (error) {
    await disconnectDatabase();
    throw error;
  }

  logger.info('Server started', { port, nodeEnv });

  process.once('SIGINT', () => {
    shutdown(server, 'SIGINT');
  });
  process.once('SIGTERM', () => {
    shutdown(server, 'SIGTERM');
  });
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  logger.error('Failed to start server', { message });
  process.exit(1);
});
