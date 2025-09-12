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

      // Translate physical activity level names per request locale without mutating cache
      const { i18nService } = req.scope.cradle;
      const translatedLevels = physicalActivityLevels.map((level) => {
        const key = `feedback.physicalActivityLevels.${level.id}`;
        const name = i18nService.translate(key);
        return { ...level, name: name === key ? level.name : name };
      });

      return { status: 200, body: { nutrientTypes, physicalActivityLevels: translatedLevels, weightTargets } };
    },
  });
}
