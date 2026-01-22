import type { Dictionary } from '../common';
import { z } from '../../util';

export const bigIntString = z.bigint().or(z.number().or(z.string()).pipe(z.coerce.number().int())).pipe(z.coerce.string());
export const uuid = z.string().uuid();
export const safeIdentifier = z.string().min(1).regex(/^[\w-]*$/);

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(z.string(), jsonSchema)]),
);

export const jsonObjectSchema: z.ZodType<Json> = z.lazy(() => z.record(z.string(), jsonSchema));

export const captcha = z
  .string()
  .nullish()
  .transform(val => val || undefined)
  .openapi({ description: 'Captcha token if enabled' });

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
