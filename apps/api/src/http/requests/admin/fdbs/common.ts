import type { ParamSchema, Schema } from 'express-validator';
import { isPlainObject } from 'lodash';
import { ZodError } from 'zod';

import { customTypeErrorMessage, typeErrorMessage } from '@intake24/api/http/requests/util';
import {
  portionSizeMethods as portionSizeMethodIds,
  portionSizeParameter,
} from '@intake24/common/surveys';
import {
  useInRecipeTypes,
} from '@intake24/common/types';
import { Category, Food, FoodsLocale, NutrientTableRecord } from '@intake24/db';

export const attributes: Schema = {
  'main.attributes.readyMealOption': {
    in: ['body'],
    errorMessage: typeErrorMessage('boolean._'),
    isBoolean: { options: { strict: true } },
    optional: { options: { nullable: true } },
  },
  'main.attributes.reasonableAmount': {
    in: ['body'],
    errorMessage: typeErrorMessage('int._'),
    isInt: true,
    optional: { options: { nullable: true } },
  },
  'main.attributes.sameAsBeforeOption': {
    in: ['body'],
    errorMessage: typeErrorMessage('boolean._'),
    isBoolean: { options: { strict: true } },
    optional: { options: { nullable: true } },
  },
  'main.attributes.useInRecipes': {
    in: ['body'],
    errorMessage: typeErrorMessage('in.options', { options: Object.values(useInRecipeTypes) }),
    isIn: { options: [Object.values(useInRecipeTypes)] },
    optional: { options: { nullable: true } },
  },
};

export const categories: ParamSchema = {
  in: ['body'],
  errorMessage: typeErrorMessage('array._'),
  isArray: { bail: true },
  optional: true,
  custom: {
    options: async (value: any[], meta): Promise<void> => {
      if (value.some(({ code }) => !code || typeof code !== 'string'))
        throw new Error(customTypeErrorMessage('array.string', meta));

      if (!value.length)
        return;

      const code = value.map(({ code }) => code);

      const availableCategories = await Category.count({ where: { code } });
      if (availableCategories !== value.length)
        throw new Error(customTypeErrorMessage('exists._', meta));
    },
  },
};

export const locales: ParamSchema = {
  in: ['body'],
  errorMessage: typeErrorMessage('array._'),
  isArray: { bail: true },
  optional: true,
  custom: {
    options: async (value: any[], meta): Promise<void> => {
      if (value.some(({ id }) => !id || typeof id !== 'string'))
        throw new Error(customTypeErrorMessage('array.string', meta));

      if (!value.length)
        return;

      const id = value.map(({ id }) => id);

      const availableLocales = await FoodsLocale.count({ where: { id } });
      if (availableLocales !== value.length)
        throw new Error(customTypeErrorMessage('exists._', meta));
    },
  },
};

export const nutrients: Schema = {
  nutrientRecords: {
    in: ['body'],
    errorMessage: typeErrorMessage('array._'),
    isArray: { bail: true },
    custom: {
      options: async (value: any[], meta): Promise<void> => {
        if (value.some(({ id }) => !id || typeof id !== 'string'))
          throw new Error(customTypeErrorMessage('array.string', meta));

        if (!value.length)
          return;

        const id = value.map(({ id }) => id);

        const availableRecords = await NutrientTableRecord.count({ where: { id } });
        if (availableRecords !== value.length)
          throw new Error(customTypeErrorMessage('exists._', meta));
      },
    },
  },
};

export const portionSizeMethods: Schema = {
  portionSizeMethods: {
    in: ['body'],
    errorMessage: typeErrorMessage('array._'),
    isArray: { bail: true },
  },
  'portionSizeMethods.*.id': {
    in: ['body'],
    errorMessage: typeErrorMessage('string._', { attributePath: 'id' }),
    isInt: true,
    optional: true,
  },
  'portionSizeMethods.*.method': {
    in: ['body'],
    errorMessage: typeErrorMessage('string._', { attributePath: 'method' }),
    isIn: {
      options: [portionSizeMethodIds],
      errorMessage: typeErrorMessage('in.options', {
        attributePath: 'method',
        options: portionSizeMethodIds,
      }),
    },
  },
  'portionSizeMethods.*.description': {
    in: ['body'],
    errorMessage: typeErrorMessage('string.max', { max: 256, attributePath: 'description' }),
    isString: true,
    isEmpty: { negated: true },
    isLength: { bail: true, options: { max: 256 } },
  },
  'portionSizeMethods.*.useForRecipes': {
    in: ['body'],
    errorMessage: typeErrorMessage('boolean._', { attributePath: 'useForRecipes' }),
    isBoolean: { options: { strict: true } },
  },
  'portionSizeMethods.*.conversionFactor': {
    in: ['body'],
    errorMessage: typeErrorMessage('float._', { attributePath: 'conversionFactor' }),
    isFloat: true,
    toFloat: true,
  },
  'portionSizeMethods.*.orderBy': {
    in: ['body'],
    errorMessage: typeErrorMessage('number._', { attributePath: 'orderBy' }),
    isInt: true,
  },
  'portionSizeMethods.*.parameters': {
    in: ['body'],
    errorMessage: typeErrorMessage('structure._'),
    custom: {
      options: (value): boolean => {
        try {
          portionSizeParameter.parse(value);
          return true;
        }
        catch (err) {
          if (err instanceof ZodError)
            throw err.errors.at(0)?.message;

          throw err;
        }
      },
    },
  },
};

export const associatedFoods: Schema = {
  associatedFoods: {
    in: ['body'],
    errorMessage: typeErrorMessage('array._'),
    isArray: { bail: true },
  },
  'associatedFoods.*.id': {
    in: ['body'],
    errorMessage: typeErrorMessage('string._', { attributePath: 'id' }),
    isInt: true,
    optional: true,
  },
  'associatedFoods.*.associatedCategoryCode': {
    in: ['body'],
    errorMessage: typeErrorMessage('string.max', { max: 32, attributePath: 'main.code' }),
    isLength: { bail: true, options: { max: 32 } },
    custom: {
      options: async (value, meta): Promise<void> => {
        const index = Number.parseInt(meta.path.match(/\[(?<index>\d+)\]/)?.groups?.index ?? '');
        if (Number.isNaN(index))
          throw new Error('Invalid index');

        const { associatedFoodCode } = meta.req.body.associatedFoods[index];

        if (value) {
          if (associatedFoodCode)
            throw new Error('Either category or food code can be defined.');

          const category = await Category.findByPk(value, { attributes: ['code'] });
          if (!category) {
            throw new Error(
              customTypeErrorMessage('exists._', meta, { attributePath: 'main.code' }),
            );
          }
        }
        else {
          if (!associatedFoodCode)
            throw new Error('Category or food code is required');
        }
      },
    },
  },
  'associatedFoods.*.associatedFoodCode': {
    in: ['body'],
    errorMessage: typeErrorMessage('string.max', { max: 32, attributePath: 'main.code' }),
    isLength: { bail: true, options: { max: 32 } },
    custom: {
      options: async (value, meta): Promise<void> => {
        const index = Number.parseInt(meta.path.match(/\[(?<index>\d+)\]/)?.groups?.index ?? '');
        if (Number.isNaN(index))
          throw new Error('Invalid index');

        const { associatedCategoryCode } = meta.req.body.associatedFoods[index];

        if (value) {
          if (associatedCategoryCode)
            throw new Error('Either category or food code can be defined.');

          const food = await Food.findByPk(value, { attributes: ['code'] });
          if (!food) {
            throw new Error(
              customTypeErrorMessage('exists._', meta, { attributePath: 'main.code' }),
            );
          }
        }
        else {
          if (!associatedCategoryCode)
            throw new Error('Category or food code is required');
        }
      },
    },
  },
  'associatedFoods.*.genericName': {
    in: ['body'],
    custom: {
      options: async (value, meta): Promise<void> => {
        if (!isPlainObject(value))
          throw new Error(customTypeErrorMessage('object._', meta));
      },
    },
  },
  'associatedFoods.*.genericName.*': {
    in: ['body'],
    errorMessage: typeErrorMessage('string._', { path: 'genericName' }),
    isString: { bail: true },
    isEmpty: { negated: true, bail: true },
  },
  'associatedFoods.*.text': {
    in: ['body'],
    custom: {
      options: async (value, meta): Promise<void> => {
        if (!isPlainObject(value))
          throw new Error(customTypeErrorMessage('object._', meta));
      },
    },
  },
  'associatedFoods.*.text.*': {
    in: ['body'],
    errorMessage: typeErrorMessage('string._', { path: 'text' }),
    isString: { bail: true },
    isEmpty: { negated: true, bail: true },
  },
  'associatedFoods.*.linkAsMain': {
    in: ['body'],
    errorMessage: typeErrorMessage('boolean._', { attributePath: 'linkAsMain' }),
    isBoolean: { options: { strict: true } },
  },
  'associatedFoods.*.multiple': {
    in: ['body'],
    errorMessage: typeErrorMessage('boolean._', { attributePath: 'multiple' }),
    isBoolean: { options: { strict: true } },
  },
  'associatedFoods.*.orderBy': {
    in: ['body'],
    errorMessage: typeErrorMessage('number._', { attributePath: 'orderBy' }),
    isInt: true,
  },
};

export const tags: ParamSchema = {
  in: ['body'],
  errorMessage: typeErrorMessage('array._'),
  isArray: { bail: true },
  optional: true,
  custom: {
    options: async (value: any[], meta): Promise<void> => {
      if (value.some(item => !item || typeof item !== 'string'))
        throw new Error(customTypeErrorMessage('array.string', meta));
    },
  },
};
