import { initServer } from '@ts-rest/express';

import { permission } from '@intake24/api/http/middleware';
import { contract } from '@intake24/common/contracts';

export function ai() {
  return initServer().router(contract.admin.ai, {
    status: {
      middleware: [permission('locales')],
      handler: async ({ req }) => {
        const { openRouterSynonymService } = req.scope.cradle;

        return {
          status: 200,
          body: {
            synonymSuggestions: {
              enabled: openRouterSynonymService.isEnabled(),
              model: openRouterSynonymService.getModel(),
            },
          },
        };
      },
    },
    suggestSynonyms: {
      middleware: [permission('locales:food-list')],
      handler: async ({ body, req }) => {
        const { openRouterSynonymService, logger } = req.scope.cradle;

        // If service is not enabled, return gracefully
        if (!openRouterSynonymService.isEnabled()) {
          return {
            status: 200,
            body: {
              enabled: false,
              suggestions: [],
            },
          };
        }

        try {
          const result = await openRouterSynonymService.generateSynonyms({
            foodName: body.foodName,
            languageCode: body.languageCode,
            existingSynonyms: body.existingSynonyms,
            category: body.category,
          });

          return {
            status: 200,
            body: {
              enabled: true,
              suggestions: result.suggestions,
              reasoning: result.reasoning,
            },
          };
        }
        catch (error) {
          logger.error('Failed to generate synonym suggestions', { error });

          return {
            status: 503,
            body: {
              message: error instanceof Error ? error.message : 'AI service temporarily unavailable',
            },
          };
        }
      },
    },
  });
}
