import { HTTPException } from 'hono/http-exception';

export type Severity = 'low' | 'medium' | 'high';
export type ErrorStatusCode = 400 | 401 | 402 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;

export abstract class TrackableError extends HTTPException {
  abstract readonly severity: Severity;
  abstract readonly errorCode: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    status: ErrorStatusCode,
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(status, { message });
    this.context = context;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends TrackableError {
  readonly severity = 'medium' as const;
  readonly errorCode = 'VALIDATION_ERROR';

  static invalidInput(field: string, value?: unknown) {
    return new ValidationError(
      400,
      'Invalid input provided',
      { field, value },
    );
  }

  static missingField(field: string) {
    return new ValidationError(
      400,
      'Required field missing',
      { field },
    );
  }
}

export class AuthenticationError extends TrackableError {
  readonly severity = 'high' as const;
  readonly errorCode = 'AUTHENTICATION_ERROR';

  static unauthorized() {
    return new AuthenticationError(
      401,
      'Unauthorized access',
      { reason: 'unauthorized' },
    );
  }

  static forbidden() {
    return new AuthenticationError(
      403,
      'Forbidden',
      { reason: 'forbidden' },
    );
  }
}

export class DatabaseError extends TrackableError {
  readonly severity = 'high' as const;
  readonly errorCode = 'DATABASE_ERROR';

  static connectionFailed() {
    return new DatabaseError(
      503,
      'Service temporarily unavailable',
      { reason: 'connection_failed' },
    );
  }

  static queryFailed(query?: string) {
    return new DatabaseError(
      500,
      'Internal Server Error',
      { query, reason: 'query_failed' },
    );
  }
}
