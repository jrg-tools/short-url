import type { Context, Next } from 'hono';
import type { FeatureFlagOptions } from '@/lib/featureflag/posthog';
import { FeatureFlagManager } from '@/lib/featureflag/posthog';

export interface FeatureFlagMiddlewareOptions {
  getDistinctId?: (c: Context) => string | Promise<string>;
  getUserProperties?: (c: Context) => Record<string, any> | Promise<Record<string, any>>;
  getGroups?: (c: Context) => Record<string, string> | Promise<Record<string, string>>;
  forceTracking?: boolean;
  overrides?: Record<string, any>; // For development/testing
}

declare module 'hono' {
  interface ContextVariableMap {
    featureFlags: FeatureFlagManager;
    getFeatureFlag: (flagKey: string, options?: FeatureFlagOptions) => Promise<import('@/lib/featureflag/posthog').FeatureFlagResult>;
    getMultipleFlags: (flagKeys: string[], options?: FeatureFlagOptions) => Promise<Record<string, import('@/lib/featureflag/posthog').FeatureFlagResult>>;
  }
}

export function createFeatureFlagMiddleware(options?: FeatureFlagMiddlewareOptions) {
  return async (c: Context, next: Next) => {
    // Initialize feature flag manager
    const flagManager = new FeatureFlagManager(c, {
      forceTracking: options?.forceTracking,
      overrides: options?.overrides,
    });

    // Get user context
    let distinctId = 'anonymous';
    let userProperties: Record<string, any> = {};
    let groups: Record<string, string> = {};

    try {
      if (options?.getDistinctId) {
        distinctId = await options.getDistinctId(c);
      }
      if (options?.getUserProperties) {
        userProperties = await options.getUserProperties(c);
      }
      if (options?.getGroups) {
        groups = await options.getGroups(c);
      }
    }
    catch (error) {
      console.warn('[FeatureFlagMiddleware] Failed to get user context:', error);
    }

    // Create convenience methods
    const getFeatureFlag = async (flagKey: string, flagOptions?: FeatureFlagOptions) => {
      return flagManager.getFeatureFlag(flagKey, distinctId, {
        userProperties,
        groups,
        ...flagOptions,
      });
    };

    const getMultipleFlags = async (flagKeys: string[], flagOptions?: FeatureFlagOptions) => {
      return flagManager.getMultipleFlags(flagKeys, distinctId, {
        userProperties,
        groups,
        ...flagOptions,
      });
    };

    // Attach to context
    c.set('featureFlags', flagManager);
    c.set('getFeatureFlag', getFeatureFlag);
    c.set('getMultipleFlags', getMultipleFlags);

    // Continue with request
    await next();

    // Clean up PostHog connection
    try {
      await flagManager.shutdown();
    }
    catch (error) {
      console.warn('[FeatureFlagMiddleware] Failed to shutdown PostHog:', error);
    }
  };
}

// Export helper types for easier usage
export type { FeatureFlagOptions, FeatureFlagResult } from '@/lib/featureflag/posthog';
