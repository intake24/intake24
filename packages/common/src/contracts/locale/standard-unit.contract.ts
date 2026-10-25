import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { standardUnitResponse } from '../../types/http';

const code = z.union([z.string().nonempty(), z.string().array().nonempty()]);

export const standardUnit = initContract().router({
  standardUnits: {
    method: 'GET',
    path: '/locales/:localeId/standard-units',
    query: z.object({ code }),
    responses: {
      200: standardUnitResponse.array(),
    },
    summary: 'Multiple standard units',
    description: 'Get definitions for the given standard units.',
  },
  standardUnit: {
    method: 'GET',
    path: '/locales/:localeId/standard-units/:code',
    responses: {
      200: standardUnitResponse,
    },
    summary: 'Single standard unit',
    description: 'Get definitions for the given standard units.',
  },
});
