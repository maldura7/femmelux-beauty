import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  errors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: Record<string, string[]>): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message);
  }
}

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): ApiError => {
  switch (error.code) {
    case 'P2002': {
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || 'field';
      return ApiError.conflict(`A record with this ${field} already exists`);
    }
    case 'P2003': {
      // Foreign key constraint violation
      return ApiError.badRequest('Referenced record does not exist');
    }
    case 'P2014': {
      // Required relation violation
      return ApiError.badRequest('Required relation constraint failed');
    }
    case 'P2025': {
      // Record not found
      return ApiError.notFound('Record not found');
    }
    default:
      return ApiError.internal('Database error occurred');
  }
};

/**
 * Handle JWT errors
 */
const handleJwtError = (error: JsonWebTokenError): ApiError => {
  if (error instanceof TokenExpiredError) {
    return ApiError.unauthorized('Token has expired');
  }
  return ApiError.unauthorized('Invalid token');
};

/**
 * Handle validation errors from Prisma
 */
const handlePrismaValidationError = (): ApiError => {
  return ApiError.badRequest('Invalid data provided');
};

/**
 * Main error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Default error values
  let error: ApiError;

  // Handle known error types
  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = handlePrismaValidationError();
  } else if (err instanceof JsonWebTokenError) {
    error = handleJwtError(err);
  } else if (err.name === 'CastError') {
    error = ApiError.badRequest('Invalid ID format');
  } else if (err.name === 'SyntaxError') {
    error = ApiError.badRequest('Invalid JSON in request body');
  } else {
    // Unknown error
    error = ApiError.internal(
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong'
    );
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
