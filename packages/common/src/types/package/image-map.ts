import { z } from 'zod';

export const pkgV2ImageMapObject = z.object({
  description: z.string(),
  navigationIndex: z.number(),
  outlineCoordinates: z.array(z.number()),
});

export const pkgV2ImageMap = z.object({
  id: z.string(),
  description: z.string(),
  baseImagePath: z.string(),
  objects: z.record(z.coerce.number(), pkgV2ImageMapObject),
});

export type PkgV2ImageMapObject = z.infer<typeof pkgV2ImageMapObject>;
export type PkgV2ImageMap = z.infer<typeof pkgV2ImageMap>;
