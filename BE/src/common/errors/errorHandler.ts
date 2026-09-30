import type { ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { config } from '../../config/env';
import { logger } from '../../config/logger';
import { sendError } from '../utils/response';
import { AppError } from './AppError';

const GENERIC_ERROR_MESSAGE = 'Something went wrong';
const INVALID_JSON_MESSAGE = 'Invalid JSON payload';

function isJsonParseError(err: unknown): err is SyntaxError {
  if (!(err instanceof SyntaxError)) {
    return false;
  }

  const candidate = err as SyntaxError & { status?: number; type?: string };
  return candidate.status === HTTP_STATUS.BAD_REQUEST && candidate.type === 'entity.parse.failed';
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 11000;
}

function statusCodeFrom(err: unknown): number {
  if (err instanceof AppError) {
    return err.statusCode;
  }

  if (isJsonParseError(err) || err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
    return HTTP_STATUS.BAD_REQUEST;
  }

  if (isDuplicateKey(err)) {
    return HTTP_STATUS.CONFLICT;
  }

  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

function messageFrom(err: unknown): string {
  if (err instanceof AppError) {
    return err.message;
  }

  if (isJsonParseError(err)) {
    return INVALID_JSON_MESSAGE;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
  }

  if (err instanceof mongoose.Error.CastError) {
    return `Invalid value for ${err.path}`;
  }

  if (isDuplicateKey(err)) {
    return 'A record with this value already exists';
  }

  if (config.nodeEnv === 'production') {
    return GENERIC_ERROR_MESSAGE;
  }

  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }

  return GENERIC_ERROR_MESSAGE;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = statusCodeFrom(err);
  const message = messageFrom(err);
  const isProduction = config.nodeEnv === 'production';

  logger.error('Request failed', {
    statusCode,
    message: err instanceof Error ? err.message : GENERIC_ERROR_MESSAGE,
    ...(isProduction || !(err instanceof Error) ? {} : { stack: err.stack }),
  });

  sendError(res, statusCode, message);
};
