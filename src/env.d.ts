export interface Bindings {
  DATABASE_URL_REPLICA: string;
  DATABASE_URL: string;
  DATABASE_TOKEN?: string;

  PRIVATE_KEY: string;

  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_ACCOUNTS_URL: string;

  DOMAIN: string;

  POSTHOG_PUBLIC_KEY: string;
  POSTHOG_HOST: string;
}

export interface Variables {
  userId: string;
}
