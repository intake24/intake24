import z from 'zod';
import { pkgV2InheritableAttributes, pkgV2PortionSizeMethod } from './foods';

export const pkgV2Category = z.object({
  version: z.string().optional(),
  code: z.string(),
  englishName: z.string(),
  name: z.string(),
  hidden: z.boolean(),
  attributes: pkgV2InheritableAttributes,
  parentCategories: z.array(z.string()),
  portionSize: z.array(pkgV2PortionSizeMethod),
});

export type PkgV2Category = z.infer<typeof pkgV2Category>;
