import httpStatus from 'http-status';
import { ExtendableError } from './extandable-error';

export class APIError extends ExtendableError {
  constructor(params: {
    message: string;
    errors?: unknown;
    stack?: string;
    status?: number;
    isPublic?: boolean;
  }) {
    super({
      message: params.message,
      errors: params.errors,
      stack: params.stack,
      status: params.status ?? httpStatus.INTERNAL_SERVER_ERROR,
      isPublic: params.isPublic ?? false,
    });
  }
}
