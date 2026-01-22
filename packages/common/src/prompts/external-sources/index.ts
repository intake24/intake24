import { z } from 'zod';

export const externalSources = ['open-food-facts'] as const;
export type ExternalSource = typeof externalSources[number];

export const openFoodFactsSource = z.object({
  type: z.literal('open-food-facts'),
  country: z.string(),
  query: z.record(z.string(), z.string()),
});
export type OpenFoodFactsSource = z.infer<typeof openFoodFactsSource>;

export const externalSourceOptions = z.discriminatedUnion(
  'type',
  [
    openFoodFactsSource,
  ],
);
export type ExternalSourceOptions = z.infer<typeof externalSourceOptions>;

export const defaultExternalSourceOptions: Record<ExternalSource, ExternalSourceOptions> = {
  'open-food-facts': {
    type: 'open-food-facts',
    country: 'world',
    query: {},
  },
};
