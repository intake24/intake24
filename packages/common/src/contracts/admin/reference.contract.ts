import { initContract } from '@ts-rest/core';
import { escape } from 'validator';
import { z } from 'zod';

import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import {
  asServedSetListEntry,
  categoryReference,
  drinkwareSetListEntry,
  faqEntry,
  feedbackSchemeEntry,
  foodReference,
  guideImageListEntry,
  imageMapListEntry,
  languageReference,
  localeReference,
  nutrientTableAttributes,
  nutrientTableRecordReference,
  nutrientTypeAttributes,
  standardUnitReference,
  surveyReference,
  surveySchemeEntry,
} from '@intake24/common/types/http/admin';

export const reference = initContract().router({
  asServedSets: {
    method: 'GET',
    path: '/admin/references/as-served-sets',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: asServedSetListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'As served sets',
    description: 'As served sets (paginated reference list)',
  },
  categories: {
    method: 'GET',
    path: '/admin/references/categories',
    query: paginationRequest.extend({ localeId: z.string().min(1) }),
    responses: {
      200: z.object({
        data: categoryReference.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Categories',
    description: 'Categories (paginated reference list)',
  },
  drinkwareSets: {
    method: 'GET',
    path: '/admin/references/drinkware-sets',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: drinkwareSetListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Drinkware sets',
    description: 'Drinkware sets (paginated reference list)',
  },
  faqs: {
    method: 'GET',
    path: '/admin/references/faqs',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: faqEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'FAQs',
    description: 'FAQs (paginated reference list)',
  },
  feedbackSchemes: {
    method: 'GET',
    path: '/admin/references/feedback-schemes',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: feedbackSchemeEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Feedback schemes',
    description: 'Feedback schemes (paginated reference list)',
  },
  foods: {
    method: 'GET',
    path: '/admin/references/foods',
    query: paginationRequest.extend({ localeId: z.string().min(1) }),
    responses: {
      200: z.object({
        data: foodReference.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Foods',
    description: 'Foods (paginated reference list)',
  },
  guideImages: {
    method: 'GET',
    path: '/admin/references/guide-images',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: guideImageListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Guide images',
    description: 'Guide images (paginated reference list)',
  },
  imageMaps: {
    method: 'GET',
    path: '/admin/references/image-maps',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: imageMapListEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Image maps',
    description: 'Image maps (paginated reference list)',
  },
  languages: {
    method: 'GET',
    path: '/admin/references/languages',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: languageReference.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Languages',
    description: 'Languages (paginated reference list)',
  },
  locales: {
    method: 'GET',
    path: '/admin/references/locales',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: localeReference.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Locales',
    description: 'Locales (paginated reference list)',
  },
  nutrientTables: {
    method: 'GET',
    path: '/admin/references/nutrient-tables',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: nutrientTableAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Nutrient tables',
    description: 'Nutrient tables (paginated reference list)',
  },
  nutrientTableRecords: {
    method: 'GET',
    path: '/admin/references/nutrient-tables/:nutrientTableId/records',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: nutrientTableRecordReference.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Nutrient tables',
    description: 'Nutrient tables (paginated reference list)',
  },
  nutrientTypes: {
    method: 'GET',
    path: '/admin/references/nutrient-types',
    query: paginationRequest.extend({
      nutrientTableId: z.string().min(1).transform(val => escape(val)).optional(),
    }),
    responses: {
      200: z.object({
        data: nutrientTypeAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Nutrient types',
    description: 'Nutrient types (paginated reference list)',
  },
  standardUnits: {
    method: 'GET',
    path: '/admin/references/standard-units',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: standardUnitReference.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Standard units',
    description: 'Standard units (paginated reference list)',
  },
  surveys: {
    method: 'GET',
    path: '/admin/references/surveys',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: surveyReference.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Surveys',
    description: 'Surveys (paginated reference list)',
  },
  surveySchemes: {
    method: 'GET',
    path: '/admin/references/survey-schemes',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: surveySchemeEntry.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Survey schemes',
    description: 'Survey schemes (paginated reference list)',
  },
});
