import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../common/constants';
import { AppError } from '../common/errors/AppError';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { listQuery, readBody, readId, sanitize } from '../common/utils/query';
import { sendSuccess } from '../common/utils/response';
import { AccessGrant } from '../models/accessGrant.model';
import { appendAccessEvent } from '../services/accessLog';

export const listAccessGrants: RequestHandler = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit } = listQuery(AccessGrant, req);
  const docs = await AccessGrant.find(filter as never).sort(sort).skip(skip).limit(limit).lean();
  sendSuccess(res, { data: sanitize(docs) });
});

export const getAccessGrant: RequestHandler = asyncHandler(async (req, res) => {
  const doc = await AccessGrant.findById(readId(req)).lean();
  if (!doc) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { data: sanitize(doc) });
});

export const createAccessGrant: RequestHandler = asyncHandler(async (req, res) => {
  const body = readBody(req) as never;
  const created = new AccessGrant(body);
  await created.save();

  try {
    await appendAccessEvent({
      grantId: String(created._id),
      patientId: String(created.patientId),
      tokenHash: created.tokenHash,
      type: 'created',
      actorUserId: created.createdBy ? String(created.createdBy) : undefined,
    });
  } catch (error) {
    await AccessGrant.findByIdAndDelete(created._id);
    throw error;
  }

  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Created',
    data: sanitize(created.toObject()),
  });
});

export const updateAccessGrant: RequestHandler = asyncHandler(async (req, res) => {
  const id = readId(req);
  const body = readBody(req);
  const existing = await AccessGrant.findById(id);
  if (!existing) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  const updated = await AccessGrant
    .findByIdAndUpdate(id, body as never, {
      new: true,
      runValidators: true,
    })
    .lean();

  if (!updated) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  if (existing.status !== 'revoked' && updated.status === 'revoked') {
    await appendAccessEvent({
      grantId: String(updated._id),
      patientId: String(updated.patientId),
      tokenHash: updated.tokenHash,
      type: 'revoked',
      actorUserId: updated.revokedBy ? String(updated.revokedBy) : undefined,
    });
  }

  sendSuccess(res, { message: 'Updated', data: sanitize(updated) });
});

export const deleteAccessGrant: RequestHandler = asyncHandler(async (req, res) => {
  const deleted = await AccessGrant.findByIdAndDelete(readId(req)).lean();
  if (!deleted) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { message: 'Deleted' });
});
