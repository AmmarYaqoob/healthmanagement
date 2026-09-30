import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { API_PREFIX } from './common/constants';
import { errorHandler } from './common/errors/errorHandler';
import { notFound } from './common/middleware/notFound.middleware';
import { logger } from './config/logger';
import { apiRouter } from './routes';

const LOCAL_ORIGIN = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    const origin = req.header('origin');
    if (origin !== undefined && LOCAL_ORIGIN.test(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    const startedAt = Date.now();

    res.on('finish', () => {
      logger.info('HTTP request', {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  });

  app.use(API_PREFIX, apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
