import { createHash } from 'crypto';
import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../common/constants';
import { AppError } from '../common/errors/AppError';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { sendSuccess } from '../common/utils/response';
import { AccessGrant } from '../models/accessGrant.model';
import { appendAccessEvent } from '../services/accessLog';

const GONE = 410;

function digestToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export const getSharedReport: RequestHandler = asyncHandler(async (req, res) => {
  const token = String(req.params.token || '');
  if (!/^[a-f0-9]{32}$/.test(token)) {
    throw new AppError('This sharing link is not valid.', HTTP_STATUS.NOT_FOUND);
  }

  const doc = await AccessGrant.findOne({ tokenHash: digestToken(token) }).lean();
  if (!doc?.report) {
    throw new AppError('This sharing link is not valid.', HTTP_STATUS.NOT_FOUND);
  }

  await appendAccessEvent({
    grantId: String(doc._id),
    patientId: String(doc.patientId),
    tokenHash: doc.tokenHash,
    type: 'viewed',
    visited: true,
  });
  await AccessGrant.updateOne({ _id: doc._id }, { $set: { visited: true } });

  if (doc.status === 'revoked') {
    throw new AppError('This sharing link has been revoked.', GONE);
  }

  if (doc.singleUse && doc.usedAt) {
    throw new AppError('The link is expired.', GONE);
  }

  if (doc.status === 'expired' || new Date(doc.expiresAt).getTime() <= Date.now()) {
    throw new AppError('The link is expired.', GONE);
  }

  if (doc.singleUse) {
    const consumed = await AccessGrant.findOneAndUpdate(
      { _id: doc._id, status: 'active', usedAt: { $exists: false } },
      { $set: { status: 'expired', usedAt: new Date(), visited: true } },
    );
    if (!consumed) {
      throw new AppError('The link is expired.', GONE);
    }
  }

  sendSuccess(res, { data: doc.report });
});
