import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  foodSearchQuery,
  foodSearchResponse,
  recipeFoodResponse,
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
  recipeFood: {
    method: 'GET',
    path: '/locales/:localeId/foods/:code/recipe-food',
    responses: {
      200: recipeFoodResponse,
    },
    summary: 'Recipe food',
    description: 'Get the recipe food data for a food if any.',
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
});
