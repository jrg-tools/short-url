import type { Context } from 'hono';
import type { Environment } from '@/lib/env';
import { env } from 'hono/adapter';
import { PostHog } from 'posthog-node';
import { getEnvironment, shouldTrackInPostHog } from '@/lib/env';

export class PostHogService {
  private static instance: PostHog | null = null;
  private static initialized = false;
  private static environment: Environment | null = null;

  static initialize(c: Context, forceTracking = false): PostHog | null {
    if (this.initialized) {
      return this.instance;
    }

    this.environment = getEnvironment(c);

    if (!shouldTrackInPostHog(this.environment) && !forceTracking) {
      console.warn('[PostHogService] Skipping initialization: not production and not forced');
      this.initialized = true;
      return null;
    }

    try {
      const { POSTHOG_PUBLIC_KEY, POSTHOG_HOST } = env(c);
      if (!POSTHOG_PUBLIC_KEY) {
        console.warn('[PostHogService] POSTHOG_PUBLIC_KEY not found');
        this.initialized = true;
        return null;
      }

      this.instance = new PostHog(POSTHOG_PUBLIC_KEY, {
        host: POSTHOG_HOST || 'https://app.posthog.com',
        flushAt: 1,
        flushInterval: 0, // Immediate flush
      });

      console.log(`[PostHogService] Initialized for environment: ${this.environment}`);
      this.initialized = true;
      return this.instance;
    }
    catch (error) {
      console.error('[PostHogService] Failed to initialize:', error);
      this.initialized = true;
      return null;
    }
  }

  static getInstance(): PostHog | null {
    return this.instance;
  }

  static isInitialized(): boolean {
    return this.initialized;
  }

  static getEnvironment(): Environment | null {
    return this.environment;
  }

  static async shutdown(): Promise<void> {
    if (this.instance) {
      try {
        await this.instance.shutdown();
        console.log('[PostHogService] Shut down successfully');
      }
      catch (error) {
        console.error('[PostHogService] Error during shutdown:', error);
      }
      this.instance = null;
      this.initialized = false;
      this.environment = null;
    }
  }

  // Helper method for safe event tracking
  static capture(event: {
    distinctId: string;
    event: string;
    properties?: Record<string, any>;
  }): void {
    if (this.instance && shouldTrackInPostHog(this.environment || 'development')) {
      try {
        this.instance.capture(event);
      }
      catch (error) {
        console.warn('[PostHogService] Failed to capture event:', error);
      }
    }
    else if (this.environment === 'development') {
      console.log('📊 [PostHog Event]', event);
    }
  }

  // Helper method for user identification
  static identify(data: {
    distinctId: string;
    properties?: Record<string, any>;
  }): void {
    if (this.instance && shouldTrackInPostHog(this.environment || 'development')) {
      try {
        this.instance.identify(data);
      }
      catch (error) {
        console.warn('[PostHogService] Failed to identify user:', error);
      }
    }
    else if (this.environment === 'development') {
      console.log('👤 [PostHog Identify]', data);
    }
  }

  // Special method for error tracking with immediate flush
  static async captureError(event: {
    distinctId: string;
    event: string;
    properties?: Record<string, any>;
  }): Promise<void> {
    if (this.instance && shouldTrackInPostHog(this.environment || 'development')) {
      try {
        this.instance.capture(event);
        // Force flush for errors to ensure they're sent immediately
        await this.instance.flush();
      }
      catch (error) {
        console.warn('[PostHogService] Failed to capture error event:', error);
      }
    }
    else if (this.environment === 'development') {
      console.error('🚨 [PostHog Error Event]', event);
    }
  }
}
