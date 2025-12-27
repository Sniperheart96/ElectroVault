/**
 * Custom Error Classes - Typisierte Fehler für bessere Fehlerbehandlung
 */

/**
 * Basis-Klasse für API-Fehler
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Fehler
 */
export class NotFoundError extends ApiError {
  constructor(entityType: string, identifier: string) {
    super(
      `${entityType} with identifier '${identifier}' not found`,
      'NOT_FOUND',
      404
    );
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict Fehler (z.B. Duplikat)
 */
export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * 400 Bad Request Fehler
 */
export class BadRequestError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'BAD_REQUEST', 400, details);
    this.name = 'BadRequestError';
  }
}

/**
 * 403 Forbidden Fehler
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 422 Unprocessable Entity - Validation Fehler
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}

/**
 * Prüft ob ein Fehler ein ApiError ist
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
