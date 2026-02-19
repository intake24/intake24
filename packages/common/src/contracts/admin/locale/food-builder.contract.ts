import { initContract } from '@ts-rest/core';

import {
  foodBuilderAttributes,
  foodBuilderRequest,
} from '@intake24/common/types/http/admin';

export const foodBuilder = initContract().router({
  get: {
    method: 'GET',
    path: '/admin/locales/:localeId/food-builders',
    responses: {
      200: foodBuilderAttributes.array(),
    },
    summary: 'Browse locale food builders',
    description: 'Browse locale food builders (paginated list)',
  },
  set: {
    method: 'POST',
    path: '/admin/locales/:localeId/food-builders',
    body: foodBuilderRequest.array(),
    responses: {
      200: foodBuilderAttributes.array(),
    },
    summary: 'Set locale food builders',
    description: 'Set locale food builders (replace existing)',
  },
});
