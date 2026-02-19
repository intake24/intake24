import type { CategoryContents, CategoryHeader, CategorySearch, UserCategoryData } from '@intake24/common/types/http';

import { http } from '@intake24/ui';

export default {
  getData: async (localeId: string, code: string): Promise<UserCategoryData> => {
    const { data } = await http.get<UserCategoryData>(`/locales/${localeId}/categories/${code}`);
    return data;
  },
  contents: async (localeId: string, code?: string, recipe = false) => {
    const { data } = await http.get<CategoryContents>(
      code ? `locales/${localeId}/category-contents/${code}` : `locales/${localeId}/category-contents`,
      { params: code && recipe ? { recipe: true } : undefined },
    );
    return data;
  },
  header: async (localeId: string, code: string) => {
    const { data } = await http.get<CategoryHeader>(`locales/${localeId}/category-headers/${code}`);
    return data;
  },
  search: async (localeId: string, code: string, params: any) => {
    const { data } = await http.get<CategorySearch>(`locales/${localeId}/categories/${code}/search`, {
      params,
    });
    return data;
  },
};
