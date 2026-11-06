import { z } from 'zod';

import { nutrient } from './shared';

export const topFoods = z.object({
  max: z.number(),
  colors: z.array(z.string()),
  nutrientTypes: nutrient.array(),
});

export type TopFoods = z.infer<typeof topFoods>;

export const defaultTopFoods: TopFoods = {
  max: 5,
  colors: [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#9c27b0',
    '#8bc34a',
    '#999999',
  ],
  nutrientTypes: [
    {
      id: ['1'],
      name: { en: 'Energy' },
    },
    {
      id: ['23'],
      name: { en: 'Sugar' },
    },
    {
      id: ['50'],
      name: { en: 'Saturated fat' },
    },
  ],
};
