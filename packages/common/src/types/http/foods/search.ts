import { z } from 'zod';
import { searchSortingAlgorithms } from '@intake24/common/surveys';
import { recipeFood } from '@intake24/common/types';
import { paginationMeta } from '../generic';

export const categoryHeader = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});

export type CategoryHeader = z.infer<typeof categoryHeader>;

export const foodHeader = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  searchTerm: z.string().nullish(),
  thumbnailImageUrl: z.string().optional(),
});

export type FoodHeader = z.infer<typeof foodHeader>;

export const foodSearchResponse = z.object({
  foods: foodHeader.array(),
  categories: categoryHeader.array(),
});

export type FoodSearchResponse = z.infer<typeof foodSearchResponse>;

export const categoryContents = z.object({
  header: categoryHeader,
  foods: foodHeader.array(),
  subcategories: categoryHeader.array(),
});
export type CategoryContents = z.infer<typeof categoryContents>;

export const categorySearch = z.object({
  data: foodHeader.array(),
  meta: paginationMeta,
});
export type CategorySearch = z.infer<typeof categorySearch>;

export const foodSearchQuery = z.object({
  description: z.string().max(120),
  previous: z.string().array().optional(),
  limit: z.coerce.number().int().optional(),
  rankingAlgorithm: z.enum(searchSortingAlgorithms).optional(),
  matchScoreWeight: z.coerce.number().int().min(0).max(100).optional(),
  recipe: z.string().optional(),
  category: z.string().optional(),
  hidden: z.string().optional(),
});

export type FoodSearchQuery = z.infer<typeof foodSearchQuery>;

export const surveyFoodSearchQuery = z.object({
  description: z.string().max(120),
  previous: z.string().array().optional(),
  recipe: z.string().optional(),
  category: z.string().optional(),
  hidden: z.string().optional(),
});

export type SurveyFoodSearchQuery = z.infer<typeof surveyFoodSearchQuery>;

export const recipeFoodResponse = recipeFood;
export type RecipeFoodResponse = z.infer<typeof recipeFoodResponse>;
