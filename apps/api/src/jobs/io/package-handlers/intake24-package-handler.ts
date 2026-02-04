import type {
  FileValidationErrorMessage,
  PackageHandler,
  PackageHandlerContext,
  PackageVerificationResult,
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

import * as yauzl from 'yauzl';
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

import { unzipFile } from '../../../util/files';
import { getVerifiedOutputPath } from '../import/utils';
import { PackageValidationFileErrors } from './types';

type ValidatedPackageContents = {
  locales?: PkgV2LocalesFile;
  foods?: PkgV2FoodsFile;
  categories?: PkgV2CategoriesFile;
  asServedSets?: PkgV2AsServedSetsFile;
  imageMaps?: PkgV2ImageMapsFile;
  guideImages?: PkgV2GuideImagesFile;
  drinkwareSets?: PkgV2DrinkwareSetsFile;
};

function getFileValidationErrorMessages(error: unknown): FileValidationErrorMessage[] {
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

export class Intake24PackageHandler implements PackageHandler {
  private readonly context: PackageHandlerContext;
  private extractedPath?: string;

  constructor(context: PackageHandlerContext) {
    this.context = context;
  }

  async verify(uploadedPath: string): Promise<PackageVerificationResult> {
    const { fileId, uploadDir } = this.context;

    try {
      await this.validateArchive(uploadedPath);
      this.extractedPath = getVerifiedOutputPath(uploadDir, fileId);
      await unzipFile(uploadedPath, this.extractedPath);
    }
    catch (err) {
      throw new PackageValidationFileErrors({ _uploadedFile: getFileValidationErrorMessages(err) });
    }

    const packageContents = await this.validateJsonFiles(this.extractedPath);

    const targetLocales = new Set<string>();

    if (packageContents.locales) {
      packageContents.locales.forEach(locale => targetLocales.add(locale.id));
    }

    if (packageContents.foods) {
      Object.keys(packageContents.foods).forEach(locale => targetLocales.add(locale));
    }

    if (packageContents.categories) {
      Object.keys(packageContents.categories).forEach(locale => targetLocales.add(locale));
    }

    return {
      extractedPath: this.extractedPath,
      summary: {
        targetLocales: [...targetLocales],
        files: {
          locales: !!packageContents.locales,
          foods: !!packageContents.foods,
          categories: !!packageContents.categories,
          asServedSets: !!packageContents.asServedSets,
          imageMaps: !!packageContents.imageMaps,
          guideImages: !!packageContents.guideImages,
          drinkwareSets: !!packageContents.drinkwareSets,
          nutrientTables: false,
        },
      },
    };
  }

  async cleanup(): Promise<void> {
    if (this.extractedPath) {
      await fs.rm(this.extractedPath, { recursive: true, force: true });
    }
  }

  private async validateArchive(uploadedPath: string): Promise<void> {
    const zipfile = await new Promise<yauzl.ZipFile>((resolve, reject) => {
      yauzl.open(uploadedPath, { lazyEntries: true }, (err, zf) => {
        if (err || !zf)
          reject(err || new LocalisableError('io.verification.invalidZipFile', undefined, { cause: err }));
        else resolve(zf);
      });
    });

    try {
      const packageJsonContent = await new Promise<string>((resolve, reject) => {
        let found = false;
        zipfile.readEntry();
        zipfile.on('entry', (entry: yauzl.Entry) => {
          if (entry.fileName === 'package.json') {
            found = true;
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err)
                return reject(err);
              if (!readStream)
                return reject(new LocalisableError('io.verification.invalidZipFile', undefined, { cause: err }));

              const chunks: Buffer[] = [];
              readStream.on('data', (chunk: Buffer) => chunks.push(chunk));
              readStream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
              readStream.on('error', reject);
            });
          }
          else {
            zipfile.readEntry();
          }
        });
        zipfile.on('end', () => {
          if (!found) {
            reject(new LocalisableError('io.verification.packageJsonNotFound'));
          }
        });
        zipfile.on('error', err => reject(new LocalisableError('io.verification.invalidZipFile', undefined, { cause: err })));
      });

      const packageJson = JSON.parse(packageJsonContent);

      const packageMetaSchema = z.object({
        version: z.string(),
        format: z.enum(['json', 'xlsx']),
      });

      packageMetaSchema.parse(packageJson);
    }
    finally {
      zipfile.close();
    }
  }

  private async validateJsonFile<T>(
    filePath: string,
    schema: z.ZodType<T>,
    pathRemapper?: (pathElements: (string | number)[]) => string,
  ): Promise<T | undefined> {
    try {
      await fs.access(filePath);
    }
    catch {
      // File does not exist, which is allowed
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

  /**
   * Creates a path remapper for foods.json and categories.json files.
   * Replaces array indices with the actual code from the item in the JSON.
   * Path structure for these files: Record<localeId, Array<{code: string, ...}>>
   */
  private createCodePathRemapper(json: unknown): ((pathElements: (string | number)[]) => string) | undefined {
    if (!json || typeof json !== 'object')
      return undefined;

    const record = json as Record<string, Array<{ code?: string }>>;

    return (pathElements: (string | number)[]): string => {
      // Path format: [localeId, arrayIndex, ...]
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

      // Fallback to dot-separated path
      return pathElements.map(p => String(p)).join('.');
    };
  }

  private async validateJsonFiles(extractedPath: string): Promise<ValidatedPackageContents> {
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
        // For foods and categories, we need to read the JSON first to create the pathRemapper
        let pathRemapper: ((pathElements: (string | number)[]) => string) | undefined;

        if (useCodeRemapper) {
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const json = JSON.parse(content);
            pathRemapper = this.createCodePathRemapper(json);
          }
          catch {
            // If we can't read the file, let validateJsonFile handle it
          }
        }

        const data = await this.validateJsonFile(filePath, schema, pathRemapper);
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
}
