import { initServer } from '@ts-rest/express';

import { contract } from '@intake24/common/contracts';

export function standardUnit() {
  return initServer().router(contract.locale.standardUnit, {
    standardUnits: async ({ params: { localeId }, query: { code }, req }) => {
      const records = await req.scope.cradle.localeService.getStandardUnits(localeId, code);

      return {
        status: 200,
        body: records,
      };
    },
    standardUnit: async ({ params: { localeId, code }, req }) => {
      const record = await req.scope.cradle.localeService.getStandardUnit(localeId, code);

      return {
        status: 200,
        body: record,
      };
    },
  });
}
