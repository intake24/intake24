import type { Meta, Schema } from 'express-validator';

import { checkSchema } from 'express-validator';

import { imageFile, isTranslationObject } from '@intake24/api/http/requests/admin/generic';
import {
  customTypeErrorMessage,
  typeErrorMessage,
  validate,
} from '@intake24/api/http/requests/util';
import { identifierSafeChars } from '@intake24/common/rules';

function validateJSON(next: (value: any, meta: Meta) => boolean) {
  return (value: any, meta: Meta): boolean => {
    try {
      const parsed = JSON.parse(value);
      return next(parsed, meta);
    }
    catch (e) {
      if (e instanceof SyntaxError)
        throw new Error(customTypeErrorMessage('json._', meta));
      else throw e;
    }
  };
}

function validateJSONPromise(next: (value: any, meta: Meta) => Promise<void>) {
  return (value: any, meta: Meta): Promise<void> => {
    try {
      const parsed = JSON.parse(value);
      return next(parsed, meta);
    }
    catch (e) {
      if (e instanceof SyntaxError)
        throw new Error(customTypeErrorMessage('json._', meta));
      else throw e;
    }
  };
}

function isArrayOfNumberPairs(value: any, meta: Meta): boolean {
  if (!Array.isArray(value))
    throw new Error(customTypeErrorMessage('array._', meta));
  if (value.length % 2 !== 0)
    throw new Error(customTypeErrorMessage('array.even', meta));
  if (value.some(v => typeof v !== 'number'))
    throw new Error(customTypeErrorMessage('array.number', meta));
  return true;
}

const scaleCommon: Schema = {
  drinkwareSetId: {
    in: ['params'],
    isString: { errorMessage: typeErrorMessage('string._') },
    isWhitelisted: {
      options: identifierSafeChars,
      errorMessage: typeErrorMessage('safeChars._'),
    },
  },
  choiceId: {
    in: ['params'],
    isInt: { errorMessage: typeErrorMessage('_.int') },
  },
  updateOnConflict: {
    in: ['query'],
    optional: true,
    isBoolean: { errorMessage: typeErrorMessage('boolean._') },
  },
  return: {
    in: ['query'],
    optional: true,
    isBoolean: { errorMessage: typeErrorMessage('boolean._') },
  },
  label: {
    in: ['body'],
    custom: { options: validateJSONPromise(isTranslationObject) },
  },
  volumeSamples: {
    in: ['body'],
    custom: {
      options: validateJSON(isArrayOfNumberPairs),
    },
  },
};

export default {
  read: validate(
    checkSchema({
      drinkwareSetId: {
        in: ['params'],
        isString: { errorMessage: typeErrorMessage('string._') },
      },
      choiceId: {
        in: ['params'],
        isInt: { errorMessage: typeErrorMessage('int._') },
      },
    }),
  ),
  storeV1: validate(
    checkSchema({
      ...scaleCommon,
      baseImage: imageFile,
      overlayImage: imageFile,
      width: {
        in: ['body'],
        isInt: { errorMessage: typeErrorMessage('int._') },
      },
      height: {
        in: ['body'],
        isInt: { errorMessage: typeErrorMessage('int._') },
      },
      emptyLevel: {
        in: ['body'],
        isInt: { errorMessage: typeErrorMessage('int._') },
      },
      fullLevel: {
        in: ['body'],
        isInt: { errorMessage: typeErrorMessage('int._') },
      },
    }),
  ),
  storeV2: validate(
    checkSchema({
      ...scaleCommon,
      image: imageFile,
      outlineCoordinates: { custom: { options: validateJSON(isArrayOfNumberPairs) } },
    }),
  ),
};
