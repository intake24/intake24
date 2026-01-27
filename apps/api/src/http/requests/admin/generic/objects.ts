import type { CustomValidator } from 'express-validator';

import { isPlainObject } from 'lodash-es';

import { customTypeErrorMessage } from '../../util';

export const isTranslationObject: CustomValidator = async (value, meta): Promise<void> => {
  if (!isPlainObject(value) || Object.values(value).some(v => typeof v !== 'string'))
    throw new Error(customTypeErrorMessage('structure._', meta));
};
