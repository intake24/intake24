import { z } from 'zod';

// A synonym set is an array of individual words that are treated as equivalent during food search.
export const pkgV2SynonymSet = z.array(z.string().min(1)).min(1);

export type PkgV2SynonymSet = z.infer<typeof pkgV2SynonymSet>;
