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
import type { ZodError, ZodIssueCode } from 'zod';
import type { ZodIssue, ValidationError as ZodValidationError } from 'zod-validation-error';
import { fromZodError } from 'zod-validation-error';

import type { I18nService } from '@intake24/api/services';
import type { I18nParams } from '@intake24/i18n';

export const standardErrorCodes = ['$unique', '$exists', '$restricted'] as const;

export type StandardErrorCode = (typeof standardErrorCodes)[number] | ZodIssueCode;

export interface ExtendedFieldValidationError extends FieldValidationError {
  code: StandardErrorCode | null;
  i18n?: {
    type: string;
    attr?: string;
    params?: I18nParams;
  };
}

export type ExtendedValidationError =
  | AlternativeValidationError
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
    case 'too_small':
      if (issue.type === 'number') {
        return i18nService.translate('validation.types.number.min', {
          attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
          min: (issue as any).minimum,
        });
      }
      if (issue.type === 'string') {
        return i18nService.translate('validation.types.string.min', {
          attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
          min: (issue as any).minimum,
        });
      }
      if (issue.type === 'array' || issue.type === 'set') {
        return i18nService.translate('validation.types.array.min', {
          attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
          min: (issue as any).minimum,
        });
      }
      return issue.message;
    case 'too_big':
      if (issue.type === 'number') {
        return i18nService.translate('validation.types.number.max', {
          attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
          max: (issue as any).maximum,
        });
      }
      if (issue.type === 'string') {
        return i18nService.translate('validation.types.string.max', {
          attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
          max: (issue as any).maximum,
        });
      }
      if (issue.type === 'array' || issue.type === 'set') {
        return i18nService.translate('validation.types.array.max', {
          attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
          max: (issue as any).maximum,
        });
      }
      return issue.message;
    case 'invalid_string': {
      const attribute = i18nService.translate(`validation.attributes.${issue.path.join('.')}`);
      // Map common Zod string validations to existing keys
      switch ((issue as any).validation) {
        case 'email':
          return i18nService.translate('validation.types.email._', { attribute });
        case 'url':
          return i18nService.translate('validation.types.url._', { attribute });
        case 'uuid':
          return i18nService.translate('validation.types.uuid._', { attribute });
        case 'datetime':
          return i18nService.translate('validation.types.date._', { attribute });
        default:
          return issue.message;
      }
    }
    case 'invalid_enum_value': {
      const options = (issue as any).options ?? [];
      return i18nService.translate('validation.types.in.options', {
        attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
        options: options.join(', '),
      });
    }
    case 'invalid_literal': {
      const expected = (issue as any).expected;
      return i18nService.translate('validation.types.in.options', {
        attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
        options: Array.isArray(expected) ? expected.join(', ') : `${expected}`,
      });
    }
    case 'invalid_date':
      return i18nService.translate('validation.types.date._', {
        attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
      });
    case 'not_finite':
      return i18nService.translate('validation.types.number._', {
        attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
      });
    case 'not_multiple_of':
      return i18nService.translate('validation.types.number.multipleOf', {
        attribute: i18nService.translate(`validation.attributes.${issue.path.join('.')}`),
        multipleOf: (issue as any).multipleOf,
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
  let firstError: ZodValidationError;

  const errors = ['pathParams', 'headers', 'query', 'body'].reduce<Record<string, ExtendedValidationError>>((acc, key) => {
    const zKey = key as keyof typeof err;
    if (!err[zKey])
      return acc;

    const error = fromZodError(err[zKey] as ZodError);
    if (!firstError)
      firstError = error;

    if (error.details.length)
      acc = { ...acc, ...mapZodIssues(error.details, i18nService, (key === 'pathParams' ? 'params' : key) as Location) };

    return acc;
  }, {});

  return res.status(400).json({
    // name: firstError!.name,
    message: firstError!.message,
    errors,
  });
}
