import { HTTPException } from 'hono/http-exception';

export type Severity = 'low' | 'medium' | 'high';
export type ErrorStatusCode = 400 | 401 | 402 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503 | 504;

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

  static readonly connectionErrorMessages: string[] = [
    'connection refused',
    'connection failed',
    'connection lost',
    'connection closed',
    'econnrefused',
    'network error',
    'database is locked',
  ];

  static readonly timeoutErrorMessages: string[] = [
    'timeout',
    'etimedout',
    'connection timeout',
    'query timeout',
    'operation timeout',
    'request timeout',
    'timed out',
  ];

  private static matchesErrorPatterns(error: unknown, patterns: string[]): boolean {
    if (!(error instanceof Error))
      return false;

    const errorMessage = error.message.toLowerCase();
    const cause = (error as any).cause;
    const causeMessage = cause?.message?.toLowerCase() || '';

    return patterns.some(pattern =>
      errorMessage.includes(pattern) || causeMessage.includes(pattern),
    );
  }

  static fromError(error: unknown): DatabaseError {
    const msg = error instanceof Error ? error.message : 'Database operation failed';

    if (DatabaseError.matchesErrorPatterns(error, DatabaseError.timeoutErrorMessages)) {
      return DatabaseError.timeout(msg);
    }
    if (DatabaseError.matchesErrorPatterns(error, DatabaseError.connectionErrorMessages)) {
      return DatabaseError.connectionFailed(msg);
    }
    return DatabaseError.queryFailed(msg);
  }

  static connectionFailed(details?: string) {
    return new DatabaseError(
      503,
      'Database connection failed',
      { reason: 'connection_failed', details },
    );
  }

  static queryFailed(details?: string) {
    return new DatabaseError(
      500,
      'Database query failed',
      { reason: 'query_failed', details },
    );
  }

  static timeout(operation?: string) {
    return new DatabaseError(
      504,
      'Database operation timed out',
      { reason: 'timeout', operation },
    );
  }
}
