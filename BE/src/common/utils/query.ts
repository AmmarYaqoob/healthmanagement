import type { Request } from 'express';
import type { Schema } from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { AppError } from '../errors/AppError';

const HIDDEN_FIELDS = new Set(['passwordHash', 'tokenHash', 'codeHash']);
const RESERVED_QUERY = new Set(['limit', 'skip', 'sort']);

interface QueryModel {
  schema: Schema;
}

export function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value instanceof Date) {
    return value;
  }

  if (value !== null && typeof value === 'object' && (value as { _bsontype?: string })._bsontype === 'ObjectId') {
    return (value as { toHexString(): string }).toHexString();
  }

  if (value !== null && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (HIDDEN_FIELDS.has(key)) {
        continue;
      }
      output[key] = sanitize(nested);
    }
    return output;
  }

  return value;
}

export function readBody(req: Request): Record<string, unknown> {
  if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new AppError('Request body must be a JSON object', HTTP_STATUS.BAD_REQUEST);
  }

  const body = { ...(req.body as Record<string, unknown>) };
  delete body._id;
  return body;
}

export function readId(req: Request): string {
  const id = req.params.id;
  if (typeof id !== 'string' || id.length === 0) {
    throw new AppError('Record id is required', HTTP_STATUS.BAD_REQUEST);
  }
  return id;
}

function readInt(value: unknown, fallback: number, max: number): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return fallback;
  }

  return Math.min(Number(value), max);
}

export function listQuery(model: QueryModel, req: Request) {
  const filter: Record<string, string> = {};

  for (const [key, raw] of Object.entries(req.query)) {
    if (RESERVED_QUERY.has(key) || typeof raw !== 'string') {
      continue;
    }

    if (model.schema.path(key)) {
      filter[key] = raw;
    }
  }

  const limit = Math.max(readInt(req.query.limit, 50, 100), 1);
  const skip = readInt(req.query.skip, 0, 10_000);

  return {
    filter,
    sort: buildSort(model, req.query.sort),
    skip,
    limit,
  };
}

function buildSort(model: QueryModel, raw: unknown): Record<string, 1 | -1> {
  if (typeof raw !== 'string' || raw.length === 0) {
    return { createdAt: -1 };
  }

  const descending = raw.startsWith('-');
  const field = descending ? raw.slice(1) : raw;
  if (!model.schema.path(field)) {
    return { createdAt: -1 };
  }

  return { [field]: descending ? -1 : 1 };
}
