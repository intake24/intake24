import { initServer } from '@ts-rest/express';

import { contract } from '@intake24/common/contracts';

export function feedback() {
  return initServer().router(contract.feedback, {
    data: async ({ req }) => {
      const { cache, cacheConfig, feedbackService } = req.scope.cradle;
      const [nutrientTypes, physicalActivityLevels, weightTargets] = await cache.remember(
        'feedback-data',
        cacheConfig.ttl,
        async () =>
          Promise.all([
            feedbackService.getNutrientTypes(),
            feedbackService.getPhysicalActivityLevels(),
            feedbackService.getWeightTargets(),
          ]),
      );

      return {
        status: 200,
        body: { nutrientTypes, physicalActivityLevels, weightTargets },
      };
    },
  });
}
