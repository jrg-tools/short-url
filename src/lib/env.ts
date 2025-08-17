import process from 'node:process';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url('DATABASE_URL must be a valid database connection URL (e.g., postgresql://... or sqlite://...)'),
  DATABASE_TOKEN: z.string().optional(),
  DATABASE_PATH: z.url('DATABASE_PATH must be a valid file:// or database URL path'),
  DATABASE_ENCRYPTION_KEY: z.string().optional(),

  PRIVATE_KEY: z.string().min(1, 'PRIVATE_KEY must be a non-empty string'),

  CLERK_SECRET_KEY: z.string().startsWith('sk_', 'CLERK_SECRET_KEY must start with "sk_" prefix'),
  CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'CLERK_PUBLISHABLE_KEY must start with "pk_" prefix'),
  CLERK_ACCOUNTS_URL: z
    .url('CLERK_ACCOUNTS_URL must be a valid HTTPS URL')
    .startsWith('https://', 'CLERK_ACCOUNTS_URL must use HTTPS for security'),

  POSTHOG_PUBLIC_KEY: z.string().optional(),
  POSTHOG_HOST: z
    .url('POSTHOG_HOST must be a valid URL when provided')
    .default('https://eu.i.posthog.com'),

  NODE_ENV: z.enum(['development', 'testing', 'production']).default('development'),
  DOMAIN: z.string().default('x.jrg.tools'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export type Environment = typeof env.NODE_ENV;

export function getEnvironment(): Environment {
  return env.NODE_ENV;
}

export function shouldTrackInPostHog(): boolean {
  return env.NODE_ENV === 'production';
}

export function isDev(): boolean {
  return env.NODE_ENV === 'development';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'testing';
}

export function isProd(): boolean {
  return env.NODE_ENV === 'production';
}
