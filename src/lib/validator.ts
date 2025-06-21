import type { Context } from 'hono';
import { getAuth } from '@hono/clerk-auth';
import { decodeJwt } from 'jose';
import { z } from 'zod';
import { Unauthorized } from '@/routes/errors';

export const aliasSchema = z.object({
  id: z.string().length(6),
});

export const querySchema = z.object({
  q: z.string(),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(10),
});

export const originUrlSchema = z.object({
  originUrl: z.string().url(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(10),
});

export const listSchema = z.object({
  q: z.string().default(''),
  page: z.coerce.number().min(1).default(1),
  size: z.coerce.number().min(1).max(100).default(10),
});
