import type { CategoryContents, CategoryHeader, CategorySearch } from '@intake24/common/types/http';

import http from './http.service';

export default {
  contents: async (localeId: string, code?: string) => {
    const { data } = await http.get<CategoryContents>(
      code ? `locales/${localeId}/category-contents/${code}` : `locales/${localeId}/category-contents`,
    );
    return data;
  },
  header: async (localeId: string, code: string) => {
    const { data } = await http.get<CategoryHeader>(`locales/${localeId}/category-headers/${code}`);
    return data;
  },
  search: async (localeId: string, code: string, params: any) => {
    const { data } = await http.get<CategorySearch>(`locales/${localeId}/categories/${code}`, {
      params,
    });
    return data;
  },
};
