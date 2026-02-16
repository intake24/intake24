import type {
  FileValidationErrorMessage,
} from './types';
import type { Dictionary } from '@intake24/common/types';
import type {
  PkgV2AsServedSetsFile,
  PkgV2CategoriesFile,
  PkgV2DrinkwareSetsFile,
  PkgV2FoodsFile,
  PkgV2GuideImagesFile,
  PkgV2ImageMapsFile,
  PkgV2LocalesFile,
} from '@intake24/common/types/package/file-schemas';

import fs from 'node:fs/promises';
import path from 'node:path';

import { z } from 'zod';

import { AggregateLocalisableError, LocalisableError } from '@intake24/api/http/errors';
import {
  pkgV2AsServedSetsFileSchema,
  pkgV2CategoriesFileSchema,
  pkgV2DrinkwareSetsFileSchema,
  pkgV2FoodsFileSchema,
  pkgV2GuideImagesFileSchema,
  pkgV2ImageMapsFileSchema,
  pkgV2LocalesFileSchema,
} from '@intake24/common/types/package/file-schemas';
import { formatZodError } from '@intake24/common/util';

import { PackageValidationFileErrors } from './types';

export type ValidatedPackageContents = {
  locales?: PkgV2LocalesFile;
  foods?: PkgV2FoodsFile;
  categories?: PkgV2CategoriesFile;
  asServedSets?: PkgV2AsServedSetsFile;
  imageMaps?: PkgV2ImageMapsFile;
  guideImages?: PkgV2GuideImagesFile;
  drinkwareSets?: PkgV2DrinkwareSetsFile;
};

export function getFileValidationErrorMessages(error: unknown): FileValidationErrorMessage[] {
  if (error instanceof z.ZodError) {
    return [{
      key: 'io.verification.zodError',
      params: {
        message: JSON.stringify(error.format()),
      },
    }];
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

async function validateJsonFile<T>(
  filePath: string,
  schema: z.ZodType<T>,
  pathRemapper?: (pathElements: (string | number)[]) => string,
): Promise<T | undefined> {
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

  return result.data;
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

  const validateFile = async <K extends keyof ValidatedPackageContents>(
    file: string,
    schema: z.ZodType<NonNullable<ValidatedPackageContents[K]>>,
    key: K,
    useCodeRemapper: boolean = false,
  ): Promise<void> => {
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

      const data = await validateJsonFile(filePath, schema, pathRemapper);
      if (data !== undefined)
        validatedContents[key] = data;
    }
    catch (err) {
      errors[file] = getFileValidationErrorMessages(err);
    }
  };

  await Promise.allSettled([
    validateFile('locales.json', pkgV2LocalesFileSchema, 'locales'),
    validateFile('foods.json', pkgV2FoodsFileSchema, 'foods', true),
    validateFile('categories.json', pkgV2CategoriesFileSchema, 'categories', true),
    validateFile('as-served-sets.json', pkgV2AsServedSetsFileSchema, 'asServedSets'),
    validateFile('image-maps.json', pkgV2ImageMapsFileSchema, 'imageMaps'),
    validateFile('guide-images.json', pkgV2GuideImagesFileSchema, 'guideImages'),
    validateFile('drinkware-sets.json', pkgV2DrinkwareSetsFileSchema, 'drinkwareSets'),
  ]);

  if (Object.keys(errors).length > 0) {
    throw new PackageValidationFileErrors(errors);
  }

  return validatedContents;
}
