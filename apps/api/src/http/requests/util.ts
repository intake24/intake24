import type { RequestHandler } from 'express';
import type { CustomValidator, Meta, ValidationChain } from 'express-validator';

import type { I18nParams } from '@intake24/i18n';

import { validation } from '@intake24/api/http/middleware';
import { FoodsLocale } from '@intake24/db';

export type ValidationMiddleware = RequestHandler | ValidationChain;

export function validate(rules: ValidationMiddleware | ValidationMiddleware[]): ValidationMiddleware[] {
  const items = Array.isArray(rules) ? rules : [rules];

  items.push(validation);
  return items;
}

export function errorMessage(key: string, params: I18nParams = {}) {
  return (value: any, { path, req }: Meta) => {
    const { i18nService } = req.scope.cradle;
    const { attributePath = path } = params;

    return i18nService.translate(key, {
      attribute: i18nService.translate(`validation.attributes.${attributePath}`),
      ...params,
    });
  };
}

export function customErrorMessage(key: string, { path, req }: Meta, params: I18nParams = {}) {
  const { i18nService } = req.scope.cradle;
  const { attributePath = path } = params;

  return i18nService.translate(key, {
    attribute: i18nService.translate(`validation.attributes.${attributePath}`),
    ...params,
  });
}

export function typeErrorMessage(type: string, params: I18nParams = {}) {
  return (value: any, { path, req }: Meta) => {
    const { i18nService } = req.scope.cradle;
    const { attributePath = path } = params;

    return i18nService.translate(`validation.types.${type}`, {
      attribute: i18nService.translate(`validation.attributes.${attributePath}`),
      ...params,
    });
  };
}

export function customTypeErrorMessage(type: string, { path, req }: Meta, params: I18nParams = {}) {
  const { i18nService } = req.scope.cradle;
  const { attributePath = path } = params;

  return i18nService.translate(`validation.types.${type}`, {
    attribute: i18nService.translate(`validation.attributes.${attributePath}`),
    ...params,
  });
}

export const localeIdValidator: CustomValidator = async (localeId: string, meta: Meta) => {
  const row = await FoodsLocale.findOne({ attributes: ['id'], where: { id: localeId } });
  if (!row)
    return Promise.reject(typeErrorMessage('locale._')(localeId, meta));
};
