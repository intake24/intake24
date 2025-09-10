import { initServer } from '@ts-rest/express';
import { pick } from 'lodash';

import { contract } from '@intake24/common/contracts';

export function category() {
  return initServer().router(contract.category, {
    browse: async ({ params, req }) => {
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
