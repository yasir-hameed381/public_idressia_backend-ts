export class ExtendableError extends Error {
  errors?: unknown;
  status?: number;
  isPublic?: boolean;
  isOperational = true;
  stack?: string;

  constructor(params: {
    message: string;
    errors?: unknown;
    status?: number;
    isPublic?: boolean;
    stack?: string;
  }) {
    super(params.message);
    this.name = this.constructor.name;
    this.message = params.message;
    this.errors = params.errors;
    this.status = params.status;
    this.isPublic = params.isPublic;
    this.stack = params.stack;
  }
}
