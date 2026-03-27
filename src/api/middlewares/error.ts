import { Request, Response, NextFunction } from 'express';
import httpStatus from 'http-status';
import { APIError } from '../errors/api-error';
import vars from '../../config/vars';

interface ValidationErrorLike {
  errors?: unknown;
  status?: number;
  name?: string;
}

export const handler = (
  err: APIError | Error,
  _req: Request,
  res: Response,
  _next?: NextFunction,
) => {
  const status = (err as APIError).status || (err as { statusCode?: number }).statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const response: Record<string, unknown> = {
    code: status,
    message: err.message || String((httpStatus as unknown as Record<number, string>)[status] ?? 'Internal Server Error'),
    errors: (err as APIError).errors,
  };

  if (vars.env === 'development') {
    response.stack = err.stack;
  }

  res.status(status);
  res.json(response);
};

export const converter = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let convertedError: APIError = err as APIError;

  const validationErr = err as ValidationErrorLike;
  if (validationErr.name === 'ValidationError' || (validationErr.errors && validationErr.status)) {
    convertedError = new APIError({
      message: 'Validation Error',
      errors: validationErr.errors,
      status: validationErr.status,
      stack: err.stack,
    });
  } else if (!(err instanceof APIError)) {
    convertedError = new APIError({
      message: err.message,
      status: (err as { status?: number }).status,
      stack: err.stack,
    });
  }

  return handler(convertedError, req, res);
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const err = new APIError({
    message: 'Not found',
    status: httpStatus.NOT_FOUND,
  });
  return handler(err, req, res);
};
