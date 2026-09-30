import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../constants';
import { AppError } from '../errors/AppError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, HTTP_STATUS.NOT_FOUND));
};
