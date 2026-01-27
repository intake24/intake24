import type { RecipeFood } from '@intake24/common/types';
import type { FoodSearchResponse, UserFoodData } from '@intake24/common/types/http';

import { http } from '@intake24/ui';

export type SearchOptions = {
  recipe?: boolean;
  hidden?: boolean;
  category?: string;
};

export default {
  search: async (
    surveySlug: string,
    description: string,
    options: SearchOptions = {},
  ): Promise<FoodSearchResponse> => {
    const { data } = await http.get<FoodSearchResponse>(`surveys/${surveySlug}/search`, {
      params: { description, ...options },
    });
    return data;
  },
  getData: async (localeId: string, code: string): Promise<UserFoodData> => {
    const { data } = await http.get<UserFoodData>(`/locales/${localeId}/foods/${code}`);
    return data;
  },
  getRecipeFood: async (localeId: string, code: string): Promise<RecipeFood> => {
    const { data } = await http.get<RecipeFood>(`/locales/${localeId}/foods/${code}/recipe-food`);
    return data;
  },
  categories: async (localeId: string, code: string): Promise<string[]> => {
    const { data } = await http.get<string[]>(`/locales/${localeId}/foods/${code}/categories`);
    return data;
  },
};
