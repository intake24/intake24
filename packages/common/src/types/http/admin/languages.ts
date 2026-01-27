import type { Pagination } from '../generic';

import validator from 'validator';
import { z } from 'zod';

import { recordVisibilities } from '@intake24/common/security';
import { applications, textDirections } from '@intake24/common/types';
import { compareMessageKeys, defaultI18nMessages, validateTranslations } from '@intake24/i18n';

import { userSecurableAttributes } from './securables';
import { owner } from './users';

export const languageAttributes = z.object({
  id: z.string(),
  code: z.string().min(1).max(16).refine(val => validator.isLocale(val)),
  englishName: z.string().min(1).max(512),
  localName: z.string().min(1).max(512),
  countryFlagCode: z.string().min(1).max(16).refine(val => validator.isLocale(val)),
  textDirection: z.enum(textDirections),
  ownerId: z.string().nullable(),
  visibility: z.enum(recordVisibilities),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LanguageAttributes = z.infer<typeof languageAttributes>;

export const languageRequest = languageAttributes.omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  visibility: true,
});

export type LanguageRequest = z.infer<typeof languageRequest>;

export const updateLanguageRequest = languageRequest.omit({ code: true });

export type UpdateLanguageRequest = z.infer<typeof updateLanguageRequest>;

export type LanguagesResponse = Pagination<LanguageAttributes>;

export const languageEntry = languageAttributes.extend({
  owner: owner.optional(),
  securables: userSecurableAttributes.array().optional(),
});

export type LanguageEntry = z.infer<typeof languageEntry>;

export type LanguageListEntry = Pick<
  LanguageAttributes,
  'id' | 'code' | 'englishName' | 'localName' | 'countryFlagCode'
>;

export const languageTranslationAttributes = z.object({
  id: z.string(),
  languageId: z.string(),
  application: z.enum(applications),
  section: z.string().min(1).max(64),
  messages: z.record(z.string(), z.any()), // TODO: fix (messages: jsonObjectSchema,)
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type LanguageTranslationAttributes = z.infer<typeof languageTranslationAttributes>;

export type LanguageTranslationsResponse = LanguageTranslationAttributes[];

export const languageTranslationRequest = languageTranslationAttributes.omit({
  createdAt: true,
  updatedAt: true,
}).refine((val) => {
  if (!val)
    return false;

  if (!validateTranslations(val.messages))
    return false;

  // @ts-expect-error - i18n types
  const defMessages = defaultI18nMessages[val.application][val.section];
  if (!defMessages)
    return false;

  if (!compareMessageKeys(defMessages, val.messages))
    return false;

  return true;
}, {
  message: 'Invalid translation messages',
  path: ['messages'],
});
