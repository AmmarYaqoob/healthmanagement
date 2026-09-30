export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);

    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
      throw new Error(`Invalid error status code: ${statusCode}`);
    }

    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, AppError);
  }
}
