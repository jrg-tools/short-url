import type { Context } from 'hono';
import { env } from 'hono/adapter';

export type Environment = 'development' | 'testing' | 'production';

export function getEnvironment(c: Context): Environment {
  const { NODE_ENV } = env(c);

  if (NODE_ENV === 'production')
    return 'production';
  if (NODE_ENV === 'test' || NODE_ENV === 'testing')
    return 'testing';
  return 'development';
}

export function shouldTrackInPostHog(environment: Environment): boolean {
  return environment === 'production';
}

export function isDev(c: Context): boolean {
  return getEnvironment(c) === 'development';
}

export function isTest(c: Context): boolean {
  return getEnvironment(c) === 'testing';
}

export function isProd(c: Context): boolean {
  return getEnvironment(c) === 'production';
}
