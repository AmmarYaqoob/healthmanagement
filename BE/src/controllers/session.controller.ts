import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../common/constants';
import { AppError } from '../common/errors/AppError';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { listQuery, readBody, readId, sanitize } from '../common/utils/query';
import { sendSuccess } from '../common/utils/response';
import { Session } from '../models/session.model';

export const listSessions: RequestHandler = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit } = listQuery(Session, req);
  const docs = await Session.find(filter as never).sort(sort).skip(skip).limit(limit).lean();
  sendSuccess(res, { data: sanitize(docs) });
});

export const getSession: RequestHandler = asyncHandler(async (req, res) => {
  const doc = await Session.findById(readId(req)).lean();
  if (!doc) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { data: sanitize(doc) });
});

export const createSession: RequestHandler = asyncHandler(async (req, res) => {
  const body = readBody(req) as never;
  const created = new Session(body);
  await created.save();
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Created',
    data: sanitize(created.toObject()),
  });
});

export const updateSession: RequestHandler = asyncHandler(async (req, res) => {
  const updated = await Session
    .findByIdAndUpdate(readId(req), readBody(req) as never, {
      new: true,
      runValidators: true,
    })
    .lean();

  if (!updated) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { message: 'Updated', data: sanitize(updated) });
});

export const deleteSession: RequestHandler = asyncHandler(async (req, res) => {
  const deleted = await Session.findByIdAndDelete(readId(req)).lean();
  if (!deleted) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { message: 'Deleted' });
});
