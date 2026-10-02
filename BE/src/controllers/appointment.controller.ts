import type { RequestHandler } from 'express';
import { HTTP_STATUS } from '../common/constants';
import { AppError } from '../common/errors/AppError';
import { asyncHandler } from '../common/middleware/asyncHandler';
import { listQuery, readBody, readId, sanitize } from '../common/utils/query';
import { sendSuccess } from '../common/utils/response';
import { Appointment } from '../models/appointment.model';

const HOUR_MS = 60 * 60 * 1000;

function readInstant(value: unknown, label: string): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`${label} is required`, HTTP_STATUS.BAD_REQUEST);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${label} is invalid`, HTTP_STATUS.BAD_REQUEST);
  }

  return parsed;
}

function applySchedule(body: Record<string, unknown>, startsAt: Date, endsAt: Date): void {
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new AppError('End time must be after the start time', HTTP_STATUS.BAD_REQUEST);
  }

  body.startsAt = startsAt;
  body.endsAt = endsAt;
  body.notifyAt = new Date(startsAt.getTime() - HOUR_MS);
}

export const listAppointments: RequestHandler = asyncHandler(async (req, res) => {
  const { filter, sort, skip, limit } = listQuery(Appointment, req);
  const docs = await Appointment.find(filter as never).sort(sort).skip(skip).limit(limit).lean();
  sendSuccess(res, { data: sanitize(docs) });
});

export const getAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const doc = await Appointment.findById(readId(req)).lean();
  if (!doc) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { data: sanitize(doc) });
});

export const createAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const body = readBody(req);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    throw new AppError('Title is required', HTTP_STATUS.BAD_REQUEST);
  }

  applySchedule(body, readInstant(body.startsAt, 'Start time'), readInstant(body.endsAt, 'End time'));
  body.title = title;
  delete body.notifiedAt;

  const created = new Appointment(body);
  await created.save();
  sendSuccess(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Created',
    data: sanitize(created.toObject()),
  });
});

export const updateAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const existing = await Appointment.findById(readId(req));
  if (!existing) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  const body = readBody(req);
  delete body.patientId;
  delete body.notifyAt;

  const startChanged = body.startsAt !== undefined;
  const endChanged = body.endsAt !== undefined;
  if (startChanged || endChanged) {
    const startsAt = readInstant(body.startsAt ?? existing.startsAt, 'Start time');
    const endsAt = readInstant(body.endsAt ?? existing.endsAt, 'End time');
    applySchedule(body, startsAt, endsAt);
    if (startsAt.getTime() !== existing.startsAt.getTime()) {
      delete body.notifiedAt;
    }
  }

  const update: { $set: Record<string, unknown>; $unset?: Record<string, 1> } = { $set: body };
  if (startChanged && body.startsAt instanceof Date && body.startsAt.getTime() !== existing.startsAt.getTime()) {
    update.$unset = { notifiedAt: 1 };
  }

  const updated = await Appointment.findByIdAndUpdate(existing._id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { message: 'Updated', data: sanitize(updated) });
});

export const deleteAppointment: RequestHandler = asyncHandler(async (req, res) => {
  const deleted = await Appointment.findByIdAndDelete(readId(req)).lean();
  if (!deleted) {
    throw new AppError('Record not found', HTTP_STATUS.NOT_FOUND);
  }

  sendSuccess(res, { message: 'Deleted' });
});
