import { z } from 'zod';
import { sexes, weightTargets } from '@intake24/common/feedback';

const year = new Date().getFullYear();
const yearMin = year - 150;
const yearMax = year;

export const userPhysicalDataAttributes = z.object({
  userId: z.string(),
  sex: z.enum(sexes).nullable(),
  weightKg: z.coerce.number().min(0).max(300).nullable(),
  heightCm: z.coerce.number().min(0).max(300).nullable(),
  birthdate: z.coerce.number().min(yearMin).max(yearMax).nullable(),
  physicalActivityLevelId: z.string().nullable(),
  weightTarget: z.enum(weightTargets).nullable(),
});
export type UserPhysicalDataAttributes = z.infer<typeof userPhysicalDataAttributes>;

export const userPhysicalDataResponse = userPhysicalDataAttributes.omit({ userId: true }).nullable();
export type UserPhysicalDataResponse = z.infer<typeof userPhysicalDataResponse>;
