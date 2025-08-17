import type { Context } from 'hono';
import type { TrackableError } from '@/lib/errors/types';
import { SERVICE_NAME } from '@/lib/constants';
import { getEnvironment } from '@/lib/env';
import { PostHogService } from '@/services/posthog';

export class ErrorTracker {
  private environment: string;
  private forceTracking: boolean;

  constructor(private c: Context, options?: { forceTracking?: boolean }) {
    this.environment = getEnvironment(c);
    this.forceTracking = options?.forceTracking || false;

    // Initialize PostHog service if not already done
    if (!PostHogService.isInitialized()) {
      PostHogService.initialize(c, this.forceTracking);
    }
  }

  async trackError(error: TrackableError, distinctId: string = 'system') {
    // Track error using shared PostHog service
    PostHogService.capture({
      distinctId,
      event: 'error_occurred',
      properties: {
        error_code: error.errorCode,
        error_type: error.constructor.name,
        message: error.message,
        severity: error.severity,
        status_code: error.status,
        method: this.c.req.method,
        path: this.c.req.path,
        url: this.c.req.url,
        user_agent: this.c.req.header('user-agent'),
        service: SERVICE_NAME,
        ...error.context,
        timestamp: new Date().toISOString(),
        environment: this.environment,
      },
    });
  }
}
