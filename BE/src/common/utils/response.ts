import type { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message?: string;
  data?: T;
}

interface ErrorResponse {
  success: false;
  message: string;
}

interface SuccessOptions<T> {
  message?: string;
  data?: T;
  statusCode?: number;
}

export function sendSuccess<T>(res: Response, options: SuccessOptions<T> = {}): void {
  const body: SuccessResponse<T> = { success: true };

  if (options.message !== undefined) {
    body.message = options.message;
  }

  if (options.data !== undefined) {
    body.data = options.data;
  }

  res.status(options.statusCode ?? 200).json(body);
}

export function sendError(res: Response, statusCode: number, message: string): void {
  const body: ErrorResponse = {
    success: false,
    message,
  };

  res.status(statusCode).json(body);
}
