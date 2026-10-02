import type { Request, RequestHandler } from 'express';
import { HTTP_STATUS } from '../common/constants';
import { AppError } from '../common/errors/AppError';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { listQuery, readBody, readId, sanitize } from '../common/utils/query';
import { sendSuccess } from '../common/utils/response';
import { logger } from '../config/logger';
import { LabResult } from '../models/labResult.model';
import { parseLabReport, type LabReportExtraction } from '../services/labReport.parser';

export const listLabResults: RequestHandler = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit } = listQuery(LabResult, req);
  const docs = await LabResult.find(filter as never)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
  sendSuccess(res, { data: sanitize(docs) });
});

export const getLabResult: RequestHandler = asyncHandler(async (req, res) => {
  const doc = await LabResult.findById(readId(req)).lean();
  if (!doc) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { data: sanitize(doc) });
});

function readPdf(req: Request): Uint8Array {
  const body: unknown = req.body;
  const isPdf = Buffer.isBuffer(body) && body.subarray(0, 5).toString('utf8') === '%PDF-';
  if (!isPdf) {
    throw new AppError('Upload a PDF file.', HTTP_STATUS.BAD_REQUEST);
  }

  return new Uint8Array(body);
}

export const extractLabReport: RequestHandler = asyncHandler(async (req, res) => {
  const bytes = readPdf(req);

  let report: LabReportExtraction;
  try {
    report = await parseLabReport(bytes);
  } catch (error) {
    logger.error('Lab report extraction failed', {
      message: error instanceof Error ? error.message : 'Unknown extraction error',
    });
    throw new AppError('This PDF could not be read.', HTTP_STATUS.BAD_REQUEST);
  }

  if (report.rows.length === 0) {
    throw new AppError(
      report.textLength < 40
        ? 'This PDF has no selectable text. Scanned reports are not supported yet.'
        : 'No laboratory rows were found in this PDF.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  sendSuccess(res, {
    data: {
      source: report.source,
      collectedAt: report.collectedAt,
      rows: report.rows,
    },
  });
});

export const createLabResult: RequestHandler = asyncHandler(async (req, res) => {
  const body = readBody(req) as never;
  const created = new LabResult(body);
  await created.save();
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Created',
    data: sanitize(created.toObject()),
  });
});

export const updateLabResult: RequestHandler = asyncHandler(async (req, res) => {
  const updated = await LabResult.findByIdAndUpdate(readId(req), readBody(req) as never, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { message: 'Updated', data: sanitize(updated) });
});

export const deleteLabResult: RequestHandler = asyncHandler(async (req, res) => {
  const deleted = await LabResult.findByIdAndDelete(readId(req)).lean();
  if (!deleted) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { message: 'Deleted' });
});
