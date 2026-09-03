import type { RequestHandler } from 'express';
import type { CustomValidator, Meta, ValidationChain } from 'express-validator';

import type { I18nParams } from '@intake24/i18n';

import path from 'node:path';

import { ValidationError } from '@intake24/api/http/errors';
import { validation } from '@intake24/api/http/middleware';
import { multerFile } from '@intake24/common/types/http';
import { FoodsLocale } from '@intake24/db';

export type ValidationMiddleware = RequestHandler | ValidationChain;

export function requireCsvUploadPath(file: unknown): string {
  if (!file)
    throw ValidationError.from({ path: 'params.file', i18n: { type: 'file._' } });

  const result = multerFile.safeParse(file);
  if (!result.success)
    throw ValidationError.from({ path: 'params.file', i18n: { type: 'file._' } });

  if (path.extname(result.data.originalname).toLowerCase() !== '.csv')
    throw ValidationError.from({ path: 'params.file', i18n: { type: 'file.ext', params: { ext: 'CSV (comma-delimited)' } } });

  return result.data.path;
}

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
