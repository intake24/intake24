import type { RequestValidationError } from '@ts-rest/express';
import type { NextFunction, Request, Response } from 'express';
import type {
  AlternativeValidationError,
  FieldValidationError,
  GroupedAlternativeValidationError,
  Location,
  UnknownFieldsError,
  ValidationError,
} from 'express-validator';
import type { ZodIssue } from 'zod-validation-error';

import type { I18nService } from '@intake24/api/services';
import type { I18nParams } from '@intake24/i18n';

import { StandardSchemaError } from '@ts-rest/core';
import { ZodIssueCode } from 'zod';

export const standardErrorCodes = ['$unique', '$exists', '$restricted'] as const;

export type StandardErrorCode = (typeof standardErrorCodes)[number] | keyof typeof ZodIssueCode;

export interface ExtendedFieldValidationError extends FieldValidationError {
  code: StandardErrorCode | null;
  i18n?: {
    type: string;
    attr?: string;
    params?: I18nParams;
  };
}

export type ExtendedValidationError
  = | AlternativeValidationError
    | GroupedAlternativeValidationError
    | UnknownFieldsError
    | ExtendedFieldValidationError;

export function getLocalisedTypeErrorMessage(
  i18nService: I18nService,
  type: string,
  attributePath: string,
  params: I18nParams = {},
): string {
  return i18nService.translate(`validation.types.${type}`, {
    attribute: i18nService.translate(`validation.attributes.${attributePath}`),
    ...params,
  });
}

function createExtendedFieldValidationError(
  error: FieldValidationError,
  i18nService: I18nService,
): ExtendedFieldValidationError {
  switch (error.msg) {
    case '$exists':
    case '$restricted':
    case '$unique':
      return {
        ...error,
        code: error.msg,
        msg: getLocalisedTypeErrorMessage(i18nService, `${error.msg.replace('$', '')}._`, error.path),
      };
    default:
      return {
        ...error,
        code: null,
      };
  }
}

export function getValidationHttpStatus(error: ExtendedValidationError): number {
  switch (error.type) {
    case 'field':
      switch (error.code) {
        case '$unique':
          return 409;
        default:
          return 400;
      }
    default:
      return 400;
  }
}

export function createExtendedValidationError(
  error: ValidationError,
  i18nService: I18nService,
): ExtendedValidationError {
  switch (error.type) {
    case 'field':
      return createExtendedFieldValidationError(error, i18nService);
    default:
      return error;
  }
}

export function formatZodIssueMessage(issue: ZodIssue, i18nService?: I18nService) {
  if (!i18nService)
    return issue.message;

  switch (issue.code) {
    case 'invalid_type':
      return i18nService.translate(`validation.types.${issue.expected}._`, {
        attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
      });
    default:
      return issue.message;
  }
}

export function mapZodIssues(details: ZodIssue[], i18nService?: I18nService, location: Location = 'body'): Record<string, ExtendedValidationError> {
  return details.reduce<Record<string, ExtendedValidationError>>((acc, issue) => {
    const path = issue.path.join('.');
    acc[path] = {
      type: 'field',
      location,
      code: issue.code,
      msg: formatZodIssueMessage(issue, i18nService),
      path,
      value: null,
    };

    return acc;
  }, {});
}

export function requestValidationErrorHandler(err: RequestValidationError, req: Request, res: Response, _next: NextFunction) {
  const { i18nService } = req.scope.cradle;
  let firstError: StandardSchemaError;

  const errors = ['pathParams', 'headers', 'query', 'body'].reduce<Record<string, ExtendedValidationError>>((acc, key) => {
    const zKey = key as keyof typeof err;
    const error = err[zKey];

    if (!error || !(error instanceof StandardSchemaError))
      return acc;

    if (!firstError)
      firstError = error;

    acc = { ...acc, ...mapZodIssues(error.issues as ZodIssue[], i18nService, (key === 'pathParams' ? 'params' : key) as Location) };

    return acc;
  }, {});

  return res.status(400).json({
    message: firstError!.message,
    errors,
  });
}
