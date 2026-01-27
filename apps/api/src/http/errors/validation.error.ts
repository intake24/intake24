import type { ExtendedFieldValidationError } from './validation-errors';
import type { I18nService } from '@intake24/api/services';

import { HttpStatusCode } from 'axios';

import { getLocalisedTypeErrorMessage } from './validation-errors';

export default class ValidationError extends Error {
  public errors: { [name: string]: ExtendedFieldValidationError } = {};
  public code: HttpStatusCode = 400;

  static from(error?: Partial<ExtendedFieldValidationError> | Partial<ExtendedFieldValidationError>[]) {
    return new ValidationError('ValidationError', error);
  }

  constructor(
    msg: string,
    error?: Partial<ExtendedFieldValidationError> | Partial<ExtendedFieldValidationError>[],
  ) {
    super(msg);

    if (!error)
      return;

    (Array.isArray(error) ? error : [error]).forEach((item) => {
      const { code, path } = item;
      if (!path)
        return;

      this.errors[path] = {
        code: code ?? null,
        type: 'field',
        path,
        msg,
        location: 'body',
        value: null,
        ...item,
      };
      this.setHttpStatus(this.errors[path]);
    });
  }

  setHttpStatus(error: ExtendedFieldValidationError) {
    switch (error.code) {
      case '$unique':
        this.code = 409;
        break;
      default:
        this.code = 400;
        break;
    }
  }

  getErrors(i18nService: I18nService) {
    return Object.entries(this.errors).reduce<Record<string, ExtendedFieldValidationError>>((acc, [key, error]) => {
      const { i18n, ...rest } = error;

      acc[key] = rest;

      if (i18n)
        acc[key].msg = getLocalisedTypeErrorMessage(i18nService, i18n.type, i18n.attr ?? rest.path, i18n.params);

      return acc;
    }, {});
  }
}
