import { initServer } from '@ts-rest/express';
import { pick } from 'lodash-es';

import { contract } from '@intake24/common/contracts';

export function category() {
  return initServer().router(contract.category, {
    entry: async ({ params, req }) => {
      const { categoryId } = params;

      const response = await req.scope.cradle.cache.remember(
        `category-entry:${categoryId}`,
        req.scope.cradle.cacheConfig.ttl,
        async () => req.scope.cradle.categoryContentsService.getCategoryData({ id: categoryId }),
      );

      return { status: 200, body: response };
    },
    codeEntry: async ({ params, req }) => {
      const { code, localeId } = params;

      const response = await req.scope.cradle.cache.remember(
        `category-entry:${localeId}:${code}`,
        req.scope.cradle.cacheConfig.ttl,
        async () => req.scope.cradle.categoryContentsService.getCategoryData({ code, localeId }),
      );

      return { status: 200, body: response };
    },
    search: async ({ params, req }) => {
      const { localeId, code } = params;

      const foods = await req.scope.cradle.categoryContentsService.searchCategory(
        localeId,
        code,
        pick(req.query, ['page', 'limit', 'sort', 'search']),
      );

      foods.data = await req.scope.cradle.foodThumbnailImageService.appendThumbnailUrls(foods.data);

      return { status: 200, body: foods };
    },
    contents: async ({ params, req }) => {
      const { localeId, code } = params;

      const categoryContents = await req.scope.cradle.categoryContentsService.getCategoryContents(
        localeId,
        code,
      );

      categoryContents.foods = await req.scope.cradle.foodThumbnailImageService.appendThumbnailUrls(categoryContents.foods);

      return { status: 200, body: categoryContents };
    },
    rootContents: async ({ params, req }) => {
      const { localeId } = params;

      const categoryContents
        = await req.scope.cradle.categoryContentsService.getRootCategories(localeId);

      categoryContents.foods = await req.scope.cradle.foodThumbnailImageService.appendThumbnailUrls(categoryContents.foods);

      return { status: 200, body: categoryContents };
    },
    header: async ({ params, req }) => {
      const { localeId, code } = params;

      const categoryHeader
        = await req.scope.cradle.categoryContentsService.getCategoryHeader(localeId, code);

      return { status: 200, body: categoryHeader };
    },
  });
}
