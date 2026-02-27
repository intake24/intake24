import type { Dictionary } from '../common';

import { z } from 'zod';

export const captcha = z
  .string()
  .nullish()
  .transform(val => val || undefined)
  .meta({ description: 'Captcha token if enabled' });

export const paginationRequest = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  sort: z.string().regex(/^.+\|(asc|desc)$/).optional(),
  search: z
    .string()
    .max(128)
    .nullish()
    .transform(val => val || undefined),
});

export const paginationMeta = z.object({
  from: z.number(),
  lastPage: z.number(),
  page: z.number(),
  path: z.string(),
  limit: z.number(),
  to: z.number(),
  total: z.number(),
});
export type PaginationMeta = z.infer<typeof paginationMeta>;

export interface Pagination<R = Dictionary> {
  data: R[];
  meta: PaginationMeta;
}

export const multerFile = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number(),
  destination: z.string(),
  filename: z.string(),
  path: z.string(),
});
export type MulterFile = z.infer<typeof multerFile>;
