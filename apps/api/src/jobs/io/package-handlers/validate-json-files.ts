import type {
  FileValidationErrorMessage,
} from './types';
import type { Dictionary } from '@intake24/common/types';
import type { PackageContentsSchema, ValidatedPackageContents } from '@intake24/common/types/package/file-schemas';

import fs from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import { AggregateLocalisableError, LocalisableError } from '@intake24/api/http/errors';
import { packageContentsSchema } from '@intake24/common/types/package/file-schemas';
import { formatZodError } from '@intake24/common/util';

import { PackageValidationFileErrors } from './types';

function getZodValidationErrorMessages(error: z.ZodError): FileValidationErrorMessage[] {
  const groupedIssues = new Map<string, string[]>();

  for (const issue of error.issues) {
    const path = issue.path.length > 0
      ? issue.path.map(element => String(element)).join('.')
      : '(root)';

    const existingMessages = groupedIssues.get(path);
    if (existingMessages) {
      if (!existingMessages.includes(issue.message))
        existingMessages.push(issue.message);
    }
    else {
      groupedIssues.set(path, [issue.message]);
    }
  }

  return [...groupedIssues.entries()].map(([path, errors]) => ({
    key: 'io.verification.schemaError',
    params: {
      path,
      errors: errors.join('; '),
    },
  }));
}

export function getFileValidationErrorMessages(error: unknown): FileValidationErrorMessage[] {
  if (error instanceof z.ZodError) {
    return getZodValidationErrorMessages(error);
  }
  else if (error instanceof SyntaxError) {
    return [{
      key: 'io.verification.invalidJsonSyntax',
      params: {
        message: error.message,
      },
    }];
  }
  else if (error instanceof LocalisableError) {
    return [error.details];
  }
  else if (error instanceof AggregateLocalisableError) {
    return error.details;
  }
  else if (error instanceof AggregateError) {
    return error.errors.flatMap(getFileValidationErrorMessages);
  }
  else if (error instanceof Error) {
    return [{
      key: 'io.verification.unexpectedError',
      params: {
        message: error.message,
      },
    }];
  }
  else {
    return [{
      key: 'io.verification.unexpectedError',
      params: {
        message: String(error),
      },
    }];
  }
}

async function validateJsonFile<T extends keyof PackageContentsSchema>(
  filePath: string,
  schema: PackageContentsSchema[T]['schema'],
  pathRemapper?: (pathElements: (string | number)[]) => string,
): Promise<ValidatedPackageContents[T] | undefined> {
  try {
    await fs.access(filePath);
  }
  catch {
    return undefined;
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const json = JSON.parse(content);

  const result = schema.safeParse(json);

  if (!result.success) {
    const formattedErrors = formatZodError(result.error, schema, json, {
      groupingDepth: 2,
      pathRemapper,
    });

    throw new AggregateLocalisableError(
      formattedErrors.map(e => ({
        key: 'io.verification.schemaError',
        params: {
          path: e.path,
          errors: e.errors.join('; '),
        },
      })),
    );
  }

  return result.data as ValidatedPackageContents[T];
}

function createCodePathRemapper(json: unknown): ((pathElements: (string | number)[]) => string) | undefined {
  if (!json || typeof json !== 'object')
    return undefined;

  const record = json as Record<string, Array<{ code?: string }>>;

  return (pathElements: (string | number)[]): string => {
    if (pathElements.length >= 2) {
      const localeId = String(pathElements[0]);
      const index = pathElements[1];

      if (typeof index === 'number') {
        const items = record[localeId];
        const code = items?.[index]?.code;

        if (code) {
          return `${localeId}.${code}`;
        }
      }
    }

    return pathElements.map(p => String(p)).join('.');
  };
}

export async function validateJsonFiles(extractedPath: string): Promise<ValidatedPackageContents> {
  const validatedContents: ValidatedPackageContents = {};
  const errors: Dictionary<FileValidationErrorMessage[]> = {};

  const validateFile = async <K extends keyof ValidatedPackageContents>(key: K, useCodeRemapper: boolean = false): Promise<void> => {
    const { file, schema } = packageContentsSchema[key];
    const filePath = path.join(extractedPath, file);
    try {
      let pathRemapper: ((pathElements: (string | number)[]) => string) | undefined;

      if (useCodeRemapper) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const json = JSON.parse(content);
          pathRemapper = createCodePathRemapper(json);
        }
        catch {
          // If we can't read the file, let validateJsonFile handle it
        }
      }

      const data = await validateJsonFile<K>(filePath, schema, pathRemapper);
      if (data !== undefined)
        validatedContents[key] = data;
    }
    catch (err) {
      errors[file] = getFileValidationErrorMessages(err);
    }
  };

  await Promise.allSettled([
    validateFile('locales'),
    validateFile('foods', true),
    validateFile('categories', true),
    validateFile('standardUnits'),
    validateFile('synonymSets'),
    validateFile('asServedSets'),
    validateFile('imageMaps'),
    validateFile('guideImages'),
    validateFile('drinkwareSets'),
  ]);

  if (Object.keys(errors).length > 0) {
    throw new PackageValidationFileErrors(errors);
  }

  return validatedContents;
}
