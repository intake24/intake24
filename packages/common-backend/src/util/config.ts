import type { StringValue } from 'ms';

import { styleText } from 'node:util';

import ms from 'ms';
import z from 'zod';
import { fromZodError } from 'zod-validation-error';

// Eslint offers incorrect replacement: this regex matches zero or one spaces but eslint wants to change it to " *" which matches any number of spaces.
// eslint-disable-next-line regexp/no-trivially-nested-quantifier
const msRegex = /^\d+(?: +)?(?:milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i;
export const msStringValue = z.custom<StringValue>(val => typeof val === 'string' && msRegex.test(val), 'Expected a value in vercel-ms format (e.g., \'30s\', \'1d\'). See https://github.com/vercel/ms');
export const parsedMsStringValue = msStringValue.transform(stringValue => ms(stringValue));

export function validateConfig<T extends z.ZodTypeAny>(sectionDescription: string, schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
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
