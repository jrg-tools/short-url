import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { getEnvironment, isDev, isProd, shouldTrackInPostHog } from '@/lib/env';
import { ErrorTracker } from '@/lib/errors/posthog';
import { TrackableError } from '@/lib/errors/types';

export interface ErrorHandlerOptions {
  getDistinctId?: (c: Context) => string | Promise<string>;
  shouldTrack?: (error: Error, c: Context) => boolean;
  onError?: (error: Error, c: Context) => void | Promise<void>;
  forceTracking?: boolean; // Override environment-based tracking
}

export function createErrorHandler(options?: ErrorHandlerOptions) {
  return async (err: Error, c: Context) => {
    const environment = getEnvironment(c);
    const isProduction = isProd(c);
    const isDevelopment = isDev(c);

    if (isDevelopment) {
      console.error('[ErrorHandler] Handling error:', err);
    }

    // Call custom error handler if provided
    if (options?.onError) {
      await options.onError(err, c);
    }

    // Handle trackable errors
    if (err instanceof TrackableError) {
      // Get distinct ID for tracking
      let distinctId = 'system';
      if (options?.getDistinctId) {
        try {
          distinctId = await options.getDistinctId(c);
        }
        catch (idError) {
          console.warn('[ErrorHandler] Failed to get distinct ID:', idError);
        }
      }

      // Check if we should track this error
      const shouldTrack = options?.shouldTrack
        ? options.shouldTrack(err, c)
        : true;

      const forceTracking = options?.forceTracking || false;

      if (shouldTrack && (shouldTrackInPostHog(environment) || forceTracking || isDevelopment)) {
        const tracker = new ErrorTracker(c, { forceTracking });

        try {
          await tracker.trackError(err, distinctId);
        }
        catch (trackingError) {
          console.error('[ErrorHandler] Failed to track error in PostHog:', trackingError);
        }
      }

      // Return structured error response
      return c.json(
        {
          error: {
            code: err.errorCode,
            message: err.message,
            ...(!isProduction && {
              context: err.context,
              environment,
            }),
          },
        },
        err.status,
      );
    }

    // Handle standard HTTP exceptions
    if (err instanceof HTTPException) {
      return c.json(
        { error: { message: err.message } },
        err.status,
      );
    }

    if (isDevelopment) {
    // Handle unexpected errors
      console.error('[ErrorHandler] Unhandled error:', err);
    }

    // Track unexpected errors too
    if (!options?.shouldTrack || options.shouldTrack(err, c)) {
      const tracker = new ErrorTracker(c);
      const unexpectedError = new (class extends TrackableError {
        readonly severity = 'high' as const;
        readonly errorCode = 'UNEXPECTED_ERROR';
      })(500, 'Internal Server Error', {
        original_error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });

      let distinctId = 'system';
      if (options?.getDistinctId) {
        try {
          distinctId = await options.getDistinctId(c);
        }
        catch (idError) {
          console.warn('[ErrorHandler] Failed to get distinct ID:', idError);
        }
      }

      const forceTracking = options?.forceTracking || false;
      if (shouldTrackInPostHog(environment) || forceTracking || isDevelopment) {
        try {
          await tracker.trackError(unexpectedError, distinctId);
        }
        catch (trackingError) {
          console.error('[ErrorHandler] Failed to track unexpected error in PostHog:', trackingError);
        }
      }
    }

    return c.json(
      {
        error: {
          message: 'Internal Server Error',
          ...(!isProduction && {
            details: err instanceof Error ? err.message : String(err),
            environment,
          }),
        },
      },
      500,
    );
  };
}
