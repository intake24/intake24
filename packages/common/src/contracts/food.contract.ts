import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  foodBuilderResponse,
  foodSearchQuery,
  foodSearchResponse,
  userFoodData,
} from '../types/http';

export const food = initContract().router({
  entry: {
    method: 'GET',
    path: '/foods/:foodId',
    responses: {
      200: userFoodData,
    },
    summary: 'Food entry',
    description:
      'Get portion size estimation options, associated foods and related data for a food from the database.',
  },
  search: {
    method: 'GET',
    path: '/locales/:localeId/foods',
    query: foodSearchQuery,
    responses: {
      200: foodSearchResponse,
    },
    summary: 'Food search',
    description: 'Returns a list of foods from the food database that match the description.',
  },
  codeEntry: {
    method: 'GET',
    path: '/locales/:localeId/foods/:code',
    responses: {
      200: userFoodData,
    },
    summary: 'Food entry',
    description:
      'Get portion size estimation options, associated foods and related data for a food from the database.',
  },
  categories: {
    method: 'GET',
    path: '/locales/:localeId/foods/:code/categories',
    responses: {
      200: z.array(z.string()),
    },
    summary: 'Food categories',
    description: 'Get the list of categories for a food.',
  },
  builders: {
    method: 'GET',
    path: '/locales/:localeId/food-builders',
    query: z.object({
      code: z.union([z.string(), z.string().array().nonempty()]),
    }),
    responses: {
      200: foodBuilderResponse.array(),
    },
    summary: 'Food builders',
    description: 'Get the food builders.',
  },
  builder: {
    method: 'GET',
    path: '/locales/:localeId/food-builders/:code',
    responses: {
      200: foodBuilderResponse,
    },
    summary: 'Food builder',
    description: 'Get the food builder data for a specific food code.',
  },
});
