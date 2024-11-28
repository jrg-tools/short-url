import { z } from 'zod';

export const aliasSchema = z.object({
  id: z.string().length(6),
});

export const querySchema = z.object({
  q: z.string(),
});

export const originUrlSchema = z.object({
  originUrl: z.string().url(),
});
