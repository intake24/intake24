import { initContract } from '@ts-rest/core';
import validator from 'validator';
import { z } from 'zod';

import { frontEnds, textDirections } from '../types';

const languageResponse = z.object({
  code: z.string(),
  englishName: z.string(),
  localName: z.string(),
  countryFlagCode: z.string(),
  textDirection: z.enum(textDirections),
  messages: z.record(z.string(), z.any()).optional(),
});

export const i18n = initContract().router({
  browseLanguages: {
    method: 'GET',
    path: '/i18n',
    responses: {
      200: languageResponse.array(),
    },
    summary: 'Browse languages',
    description: 'Fetch list of available languages for front-ends.',
  },
  getLanguage: {
    method: 'GET',
    path: '/i18n/:languageId',
    pathParams: z.object({
      languageId: z.string().refine(val => validator.isLocale(val)),
    }),
    query: z.object({
      app: z.enum(frontEnds),
    }),
    responses: {
      200: languageResponse,
    },
    summary: 'Get language entry',
    description: 'Get language entry and available translations.',
  },
});
