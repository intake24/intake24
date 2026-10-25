import { z } from 'zod';

import { standardUnitAttributes } from '../http/admin';

export const pkgV2StandardUnit = standardUnitAttributes.pick({
  code: true,
  name: true,
  icon: true,
  estimateIn: true,
  howMany: true,
}).partial({ icon: true });

export type PkgV2StandardUnit = z.infer<typeof pkgV2StandardUnit>;
