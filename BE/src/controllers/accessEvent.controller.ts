import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../common/constants';
import { AppError } from '../common/errors/AppError';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { listQuery, readId, sanitize } from '../common/utils/query';
import { sendSuccess } from '../common/utils/response';
import { AccessEvent } from '../models/accessEvent.model';

export const listAccessEvents: RequestHandler = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit } = listQuery(AccessEvent, req);
  const docs = await AccessEvent.find(filter as never).sort(sort).skip(skip).limit(limit).lean();
  sendSuccess(res, { data: sanitize(docs) });
});

export const getAccessEvent: RequestHandler = asyncHandler(async (req, res) => {
  const doc = await AccessEvent.findById(readId(req)).lean();
  if (!doc) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { data: sanitize(doc) });
});

export const createAccessEvent: RequestHandler = asyncHandler(async (_req, _res) => {
  throw new AppError('Access log entries cannot be changed.', HTTP_STATUS.FORBIDDEN);
});

export const updateAccessEvent: RequestHandler = asyncHandler(async (_req, _res) => {
  throw new AppError('Access log entries cannot be changed.', HTTP_STATUS.FORBIDDEN);
});

export const deleteAccessEvent: RequestHandler = asyncHandler(async (_req, _res) => {
  throw new AppError('Access log entries cannot be changed.', HTTP_STATUS.FORBIDDEN);
});
