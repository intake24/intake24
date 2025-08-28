import { initContract } from '@ts-rest/core';
import {
  categoryContents,
  categoryHeader,
  categorySearch,
  paginationRequest,
} from '../types/http';

export const category = initContract().router({
  browse: {
    method: 'GET',
    path: '/locales/:localeId/categories/:code',
    query: paginationRequest,
    responses: {
      200: categorySearch,
    },
    summary: 'Browse category contents',
    description:
      'Browse and search category contents for foods and subcategories listed under the given category.',
  },
  rootContents: {
    method: 'GET',
    path: '/locales/:localeId/category-contents',
    responses: {
      200: categoryContents,
    },
    summary: 'Root category contents',
    description: 'Get the list of root categories & foods for the "browse all foods" options.',
  },
  contents: {
    method: 'GET',
    path: '/locales/:localeId/category-contents/:code',
    responses: {
      200: categoryContents,
    },
    summary: 'Category contents',
    description:
      'Get the category contents, i.e. foods and subcategories listed under the given category.',
  },
  header: {
    method: 'GET',
    path: '/locales/:localeId/category-headers/:code',
    responses: {
      200: categoryHeader,
    },
    summary: 'Category header',
    description:
      'Get the category header, useful if only the local name is required',
  },
});
