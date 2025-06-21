import type { Context } from 'hono';
import type { Environment } from '@/lib/env';
import type { TrackableError } from '@/lib/errors/types';
import { env } from 'hono/adapter';
import { PostHog } from 'posthog-node';
import { getEnvironment, shouldTrackInPostHog } from '@/lib/env';

export class ErrorTracker {
  private posthog: PostHog | null = null;
  private environment: Environment;
  private forceTracking: boolean;

  constructor(private c: Context, options?: { forceTracking?: boolean }) {
    this.environment = getEnvironment(c);
    this.forceTracking = options?.forceTracking || false;
    this.initializePostHog();
  }

  private initializePostHog() {
    // Only initialize PostHog in production
    if (!shouldTrackInPostHog(this.environment) && !this.forceTracking) {
      console.warn('[ErrorTracker] PostHog initialization skipped: not production and not forced');
      return;
    }

    try {
      const { POSTHOG_PUBLIC_KEY, POSTHOG_HOST } = env(this.c);

      if (!POSTHOG_PUBLIC_KEY) {
        console.warn('[ErrorTracker] POSTHOG_PUBLIC_KEY not found in production environment');
        return;
      }

      this.posthog = new PostHog(POSTHOG_PUBLIC_KEY, {
        host: POSTHOG_HOST || 'https://app.posthog.com',
        flushAt: 1,
        flushInterval: 0, // Flush immediately
      });
    }
    catch (error) {
      console.warn('[ErrorTracker] PostHog initialization failed:', error);
    }
  }

  async trackError(error: TrackableError, distinctId: string = 'system') {
    const errorData = {
      errorCode: error.errorCode,
      errorType: error.constructor.name,
      message: error.message,
      severity: error.severity,
      statusCode: error.status,
      context: error.context,
      environment: this.environment,
      method: this.c.req.method,
      path: this.c.req.path,
      url: this.c.req.url,
      timestamp: new Date().toISOString(),
      service: 'ShortURL',
    };

    // In production: track to PostHog
    if (this.posthog && (shouldTrackInPostHog(this.environment) || this.forceTracking)) {
      try {
        this.posthog.capture({
          distinctId,
          event: 'error_occurred',
          properties: {
            error_code: error.errorCode,
            error_type: error.constructor.name,
            message: error.message,
            severity: error.severity,
            status_code: error.status,

            // Request context
            method: this.c.req.method,
            path: this.c.req.path,
            url: this.c.req.url,
            user_agent: this.c.req.header('user-agent'),
            service: 'ShortURL',

            // Custom context from error
            ...error.context,

            // Additional metadata
            timestamp: new Date().toISOString(),
            environment: this.environment,
          },
        });

        await this.posthog.shutdown();
      }
      catch (trackingError) {
        console.warn('[ErrorTracker] Failed to track error to PostHog:', trackingError);
      }
    }

    // In development: log to console with full details
    else if (this.environment === 'development') {
      console.error('🚨 [ERROR TRACKED]', {
        ...errorData,
        distinctId,
        posthogInitialized: !!this.posthog,
        forceTracking: this.forceTracking,
        note: 'This would be sent to PostHog in production',
      });
    }

    // In testing: silent (or you could add test-specific logging)
    else if (this.environment === 'testing') {
      // Optionally log for debugging tests
      // console.log('[TEST] Error tracked:', errorData);
    }
  }
}
