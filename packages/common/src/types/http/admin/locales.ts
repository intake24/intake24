import type { Pagination } from '../generic';

import validator from 'validator';
import { z } from 'zod';

import { recordVisibilities } from '@intake24/common/security';

import { textDirections } from '../../common';
import { languageAttributes } from './languages';
import { userSecurableAttributes } from './securables';
import { owner } from './users';

export const systemLocaleAttributes = z.object({
  id: z.string(),
  code: z.string().min(1).max(64),
  englishName: z.string().min(1).max(64),
  localName: z.string().min(1).max(64),
  respondentLanguageId: languageAttributes.shape.code,
  adminLanguageId: languageAttributes.shape.code,
  countryFlagCode: z.string().min(1).max(16).refine(val => validator.isLocale(val)),
  textDirection: z.enum(textDirections),
  foodIndexEnabled: z.boolean(),
  foodIndexLanguageBackendId: z.string().min(1).max(16),
  ownerId: z.string().nullable(),
  visibility: z.enum(recordVisibilities),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SystemLocaleAttributes = z.infer<typeof systemLocaleAttributes>;

export const localeRequest = systemLocaleAttributes.omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  textDirection: true,
  foodIndexEnabled: true,
  foodIndexLanguageBackendId: true,
  visibility: true,
});
export type LocaleRequest = z.infer<typeof localeRequest>;

export const updateLocaleRequest = localeRequest.omit({ code: true });

export type UpdateLocaleRequest = z.infer<typeof updateLocaleRequest>;

export type LocalesResponse = Pagination<SystemLocaleAttributes>;

export const localeEntry = systemLocaleAttributes.extend({
  parent: systemLocaleAttributes.optional(),
  adminLanguage: languageAttributes.optional(),
  respondentLanguage: languageAttributes.optional(),
  owner: owner.optional(),
  securables: userSecurableAttributes.array().optional(),
});

export type LocaleEntry = z.infer<typeof localeEntry>;

export const localeListEntry = localeEntry.pick({
  id: true,
  code: true,
  englishName: true,
  localName: true,
  countryFlagCode: true,
});

export type LocaleListEntry = z.infer<typeof localeListEntry>;

export const localeRefs = z.object({
  foodIndexLanguageBackends: z.object({
    id: z.string(),
    name: z.string(),
  }).array(),
});

export type LocaleRefs = z.infer<typeof localeRefs>;

export const splitListAttributes = z.object({
  id: z.string(),
  localeId: z.string(),
  firstWord: z.string().min(1).max(64),
  words: z.string().min(1),
});
export type SplitListAttributes = z.infer<typeof splitListAttributes>;

export const splitListRequest = splitListAttributes.partial({ id: true });
export type SplitListRequest = z.infer<typeof splitListRequest>;

export const splitWordAttributes = z.object({
  id: z.string(),
  localeId: z.string(),
  words: z.string().min(1),
});
export type SplitWordAttributes = z.infer<typeof splitListAttributes>;

export const splitWordRequest = splitWordAttributes.partial({ id: true });
export type SplitWordRequest = z.infer<typeof splitWordRequest>;

export const synonymSetAttributes = z.object({
  id: z.string(),
  localeId: z.string(),
  synonyms: z.string().min(1),
});
export type SynonymSetAttributes = z.infer<typeof synonymSetAttributes>;

export const synonymSetRequest = synonymSetAttributes.partial({ id: true });
export type SynonymSetRequest = z.infer<typeof synonymSetRequest>;
