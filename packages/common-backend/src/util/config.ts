import { styleText } from 'node:util';

import ms from 'ms';
import z from 'zod';
import { fromZodError } from 'zod-validation-error';

import { msStringValue } from '@intake24/common/types';

export { msStringValue };
export const parsedMsStringValue = msStringValue.transform(stringValue => ms(stringValue));

// dotenv reads `VAR=` as '', which would bypass schema defaults; array items are left as-is.
export function emptyStringsToUndefined(value: unknown): unknown {
  if (value === '')
    return undefined;

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      emptyStringsToUndefined(item),
    ]));
  }

  return value;
}

export function validateConfig<T extends z.ZodTypeAny>(sectionDescription: string, schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(emptyStringsToUndefined(data));
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      const prettyError = fromZodError(err);
      const message
        = `${styleText(['red'], `${sectionDescription} validation failed -- check the .env file\n`)
        }\n${prettyError}\n`;
      throw new Error(message, { cause: err });
    }
    else {
      throw err;
    }
  }
}
