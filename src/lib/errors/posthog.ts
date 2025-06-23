import type { Context } from 'hono';
import type { TrackableError } from '@/lib/errors/types';
import { getEnvironment } from '@/lib/env';
import { SERVICE_NAME } from '../constants';
import { PostHogService } from '../services/posthog';

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
      service: SERVICE_NAME,
    };

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

    // Development logging
    if (this.environment === 'development') {
      console.error('🚨 [ERROR TRACKED]', {
        ...errorData,
        distinctId,
        note: 'This would be sent to PostHog in production',
      });
    }
  }
}
