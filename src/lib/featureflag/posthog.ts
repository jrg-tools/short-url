import type { Context } from 'hono';
import type { Environment } from '@/lib/env';
import { env } from 'hono/adapter';
import { PostHog } from 'posthog-node';
import { getEnvironment, shouldTrackInPostHog } from '@/lib/env';

export interface FeatureFlagOptions {
  defaultValue?: boolean | string | number;
  userId?: string;
  userProperties?: Record<string, any>;
  groups?: Record<string, string>;
}

export interface FeatureFlagResult {
  isEnabled: boolean;
  value: boolean | string | number;
  variant?: string;
  source: 'posthog' | 'default' | 'override';
}

export class FeatureFlagManager {
  private posthog: PostHog | null = null;
  private environment: Environment;
  private forceTracking: boolean;
  private overrides: Map<string, any> = new Map();

  constructor(private c: Context, options?: { forceTracking?: boolean; overrides?: Record<string, any> }) {
    this.environment = getEnvironment(c);
    this.forceTracking = options?.forceTracking || false;

    // Set up local overrides for development/testing
    if (options?.overrides) {
      Object.entries(options.overrides).forEach(([key, value]) => {
        this.overrides.set(key, value);
      });
    }

    this.initializePostHog();
  }

  private initializePostHog() {
    // Only initialize PostHog in production or when forced
    if (!shouldTrackInPostHog(this.environment) && !this.forceTracking) {
      console.warn('[FeatureFlagManager] PostHog initialization skipped: not production and not forced');
      return;
    }

    try {
      const { POSTHOG_PUBLIC_KEY, POSTHOG_HOST } = env(this.c);

      if (!POSTHOG_PUBLIC_KEY) {
        console.warn('[FeatureFlagManager] POSTHOG_PUBLIC_KEY not found in production environment');
        return;
      }

      this.posthog = new PostHog(POSTHOG_PUBLIC_KEY, {
        host: POSTHOG_HOST || 'https://app.posthog.com',
        flushAt: 1,
        flushInterval: 0,
      });
    }
    catch (error) {
      console.warn('[FeatureFlagManager] PostHog initialization failed:', error);
    }
  }

  async getFeatureFlag(
    flagKey: string,
    distinctId: string,
    options?: FeatureFlagOptions,
  ): Promise<FeatureFlagResult> {
    const defaultValue = options?.defaultValue ?? false;

    // Check for local overrides first (useful for development/testing)
    if (this.overrides.has(flagKey)) {
      const overrideValue = this.overrides.get(flagKey);
      return {
        isEnabled: Boolean(overrideValue),
        value: overrideValue,
        source: 'override',
      };
    }

    // In production: use PostHog
    if (this.posthog && (shouldTrackInPostHog(this.environment) || this.forceTracking)) {
      try {
        const result = await this.posthog.getFeatureFlag(flagKey, distinctId, {
          groups: options?.groups,
        });

        // Track flag evaluation for analytics
        await this.trackFeatureFlagUsage(flagKey, distinctId, result, options);

        return {
          isEnabled: Boolean(result),
          value: result ?? defaultValue,
          source: 'posthog',
        };
      }
      catch (error) {
        console.warn(`[FeatureFlagManager] Failed to fetch feature flag '${flagKey}':`, error);

        // Fall back to default
        return {
          isEnabled: Boolean(defaultValue),
          value: defaultValue,
          source: 'default',
        };
      }
    }

    // In development/testing: use default or environment-specific logic
    if (this.environment === 'development') {
      console.log(`🚩 [FEATURE FLAG] ${flagKey} = ${defaultValue} (default - would query PostHog in production)`);
    }

    return {
      isEnabled: Boolean(defaultValue),
      value: defaultValue,
      source: 'default',
    };
  }

  async getMultipleFlags(
    flagKeys: string[],
    distinctId: string,
    options?: FeatureFlagOptions,
  ): Promise<Record<string, FeatureFlagResult>> {
    const results: Record<string, FeatureFlagResult> = {};

    if (this.posthog && (shouldTrackInPostHog(this.environment) || this.forceTracking)) {
      try {
        const flags = await this.posthog.getAllFlags(distinctId, {
          groups: options?.groups,
        });

        for (const flagKey of flagKeys) {
          const value = flags[flagKey] ?? options?.defaultValue ?? false;
          results[flagKey] = {
            isEnabled: Boolean(value),
            value,
            source: 'posthog',
          };
        }

        // Track bulk flag evaluation
        await this.trackBulkFeatureFlagUsage(flagKeys, distinctId, results, options);

        return results;
      }
      catch (error) {
        console.warn('[FeatureFlagManager] Failed to fetch multiple feature flags:', error);
      }
    }

    // Fallback to defaults
    for (const flagKey of flagKeys) {
      const defaultValue = options?.defaultValue ?? false;
      results[flagKey] = {
        isEnabled: Boolean(defaultValue),
        value: defaultValue,
        source: 'default',
      };
    }

    return results;
  }

  private async trackFeatureFlagUsage(
    flagKey: string,
    distinctId: string,
    flagValue: any,
    options?: FeatureFlagOptions,
  ) {
    if (!this.posthog)
      return;

    try {
      this.posthog.capture({
        distinctId,
        event: 'feature_flag_evaluated',
        properties: {
          flag_key: flagKey,
          flag_value: flagValue,
          method: this.c.req.method,
          path: this.c.req.path,
          url: this.c.req.url,
          user_agent: this.c.req.header('user-agent'),
          service: 'ShortURL',
          environment: this.environment,
          timestamp: new Date().toISOString(),
          ...options?.userProperties,
        },
      });
    }
    catch (error) {
      console.warn('[FeatureFlagManager] Failed to track feature flag usage:', error);
    }
  }

  private async trackBulkFeatureFlagUsage(
    flagKeys: string[],
    distinctId: string,
    results: Record<string, FeatureFlagResult>,
    options?: FeatureFlagOptions,
  ) {
    if (!this.posthog)
      return;

    try {
      this.posthog.capture({
        distinctId,
        event: 'feature_flags_bulk_evaluated',
        properties: {
          flag_keys: flagKeys,
          flag_results: Object.fromEntries(
            Object.entries(results).map(([key, result]) => [key, result.value]),
          ),
          method: this.c.req.method,
          path: this.c.req.path,
          url: this.c.req.url,
          user_agent: this.c.req.header('user-agent'),
          service: 'ShortURL',
          environment: this.environment,
          timestamp: new Date().toISOString(),
          ...options?.userProperties,
        },
      });
    }
    catch (error) {
      console.warn('[FeatureFlagManager] Failed to track bulk feature flag usage:', error);
    }
  }

  // Helper method to set local overrides (useful for testing)
  setOverride(flagKey: string, value: any) {
    this.overrides.set(flagKey, value);
  }

  // Helper method to clear overrides
  clearOverrides() {
    this.overrides.clear();
  }

  // Clean up PostHog connection
  async shutdown() {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
  }
}
