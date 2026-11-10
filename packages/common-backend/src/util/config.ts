import { styleText } from 'node:util';

import ms from 'ms';
import z from 'zod';
import { fromZodError } from 'zod-validation-error';

import { msStringValue } from '@intake24/common/types';

export { msStringValue };
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
