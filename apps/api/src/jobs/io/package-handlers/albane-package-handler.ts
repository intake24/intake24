import type { AlbaneConversionResult } from '../import/albane/albane-locale-builder';
import type {
  FileValidationErrorMessage,
  PackageHandler,
  PackageHandlerContext,
  PackageVerificationResult,
} from './types';

import fs from 'node:fs/promises';
import path from 'node:path';

import * as yauzl from 'yauzl';

import { LocalisableError } from '@intake24/api/http/errors';

import { unzipFile } from '../../../util/files';
import { AlbaneLocaleBuilder } from '../import/albane/albane-locale-builder';
import { getVerifiedOutputPath } from '../import/utils';
import { PackageValidationFileErrors } from './types';

function getFileValidationErrorMessages(error: unknown): FileValidationErrorMessage[] {
  if (error instanceof SyntaxError) {
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

export class AlbanePackageHandler implements PackageHandler {
  private readonly context: PackageHandlerContext;
  private convertedPackagePath?: string;

  constructor(context: PackageHandlerContext) {
    this.context = context;
  }

  async verify(uploadedPath: string): Promise<PackageVerificationResult> {
    const { fileId, uploadDir, logger } = this.context;

    let albaneExtractedPath: string | undefined;

    try {
      await this.validateArchive(uploadedPath);
      albaneExtractedPath = await this.extractArchive(uploadedPath, uploadDir, fileId);
    }
    catch (err) {
      if (err instanceof PackageValidationFileErrors)
        throw err;

      throw new PackageValidationFileErrors({ _uploadedFile: getFileValidationErrorMessages(err) });
    }

    let conversionResult: AlbaneConversionResult;
    try {
      const result = await this.convertPackage(albaneExtractedPath, uploadDir, fileId, logger);
      conversionResult = result.conversionResult;
      this.convertedPackagePath = result.convertedPackagePath;
    }
    catch (err) {
      if (err instanceof PackageValidationFileErrors) {
        throw err;
      }
      throw new PackageValidationFileErrors({ package: getFileValidationErrorMessages(err) });
    }
    finally {
      // Clean up Albane source files regardless of outcome
      if (albaneExtractedPath) {
        await fs.rm(albaneExtractedPath, { recursive: true, force: true });
      }
    }

    // Build summary directly from conversion result - no need to validate JSON files
    // since the output is correct by construction
    const targetLocales = Object.keys(conversionResult.foods);

    return {
      extractedPath: this.convertedPackagePath,
      summary: {
        targetLocales,
        files: {
          locales: conversionResult.locales.length > 0,
          foods: Object.keys(conversionResult.foods).length > 0,
          categories: Object.keys(conversionResult.categories).length > 0,
          asServedSets: (conversionResult.asServedSets?.length ?? 0) > 0,
          imageMaps: false,
          guideImages: false,
          drinkwareSets: false,
          nutrientTables: false,
        },
      },
    };
  }

  async cleanup(): Promise<void> {
    if (this.convertedPackagePath) {
      await fs.rm(this.convertedPackagePath, { recursive: true, force: true });
    }
  }

  private static readonly REQUIRED_FILES = [
    'FDLIST.xlsx',
    'CATEGORIES_I24_FOOD.xlsx',
    'CATEGORIES_I24_LIST.xlsx',
    'ALTERNATIVE_FOOD_DESCRIPTION.xlsx',
    'ASSOCIATED_FOOD_PROMPTS.xlsx',
    'FACETS.xlsx',
    'US.xlsx',
    'FDQUANT.xlsx',
  ];

  private async validateArchive(uploadedPath: string): Promise<void> {
    const zipfile = await new Promise<yauzl.ZipFile>((resolve, reject) => {
      yauzl.open(uploadedPath, { lazyEntries: true }, (err, zf) => {
        if (err || !zf)
          reject(err || new LocalisableError('io.verification.invalidZipFile', undefined, { cause: err }));
        else resolve(zf);
      });
    });

    try {
      // Map each required filename to its full path in the archive (if found)
      const foundPaths = await new Promise<Map<string, string>>((resolve, reject) => {
        const paths = new Map<string, string>();
        zipfile.readEntry();
        zipfile.on('entry', (entry: yauzl.Entry) => {
          if (entry.fileName.endsWith('.xlsx')) {
            const basename = entry.fileName.split('/').pop()!;
            paths.set(basename, entry.fileName);
          }
          zipfile.readEntry();
        });
        zipfile.on('end', () => resolve(paths));
        zipfile.on('error', err => reject(new LocalisableError('io.verification.invalidZipFile', undefined, { cause: err })));
      });

      const fileErrors: Record<string, FileValidationErrorMessage[]> = {};

      for (const required of AlbanePackageHandler.REQUIRED_FILES) {
        const archivePath = foundPaths.get(required);
        if (archivePath === undefined) {
          fileErrors[required] = [{
            key: 'io.verification.albaneRequiredFileMissing',
          }];
        }
        else if (archivePath !== required) {
          fileErrors[required] = [{
            key: 'io.verification.albaneRequiredFileWrongPath',
            params: { archivePath },
          }];
        }
      }

      if (Object.keys(fileErrors).length > 0) {
        throw new PackageValidationFileErrors(fileErrors);
      }
    }
    finally {
      zipfile.close();
    }
  }

  private async extractArchive(uploadedPath: string, uploadDir: string, fileId: string): Promise<string> {
    const extractedPath = path.join(uploadDir, `i24-albane-source-${fileId}`);
    await unzipFile(uploadedPath, extractedPath);
    return extractedPath;
  }

  private async convertPackage(
    albaneExtractedPath: string,
    uploadDir: string,
    fileId: string,
    logger: PackageHandlerContext['logger'],
  ): Promise<{ conversionResult: AlbaneConversionResult; convertedPackagePath: string }> {
    const convertedPackagePath = getVerifiedOutputPath(uploadDir, fileId);

    await fs.mkdir(convertedPackagePath, { recursive: true });

    const builder = new AlbaneLocaleBuilder(logger, albaneExtractedPath, this.context.servicesConfig.deepl, this.context.cacheDir);
    const conversionResult = await builder.buildPackage();

    await this.writeConvertedPackage(convertedPackagePath, conversionResult);

    return { conversionResult, convertedPackagePath };
  }

  private async writeConvertedPackage(convertedPackagePath: string, result: AlbaneConversionResult): Promise<void> {
    const writeJson = async (filename: string, data: unknown) => {
      await fs.writeFile(
        path.join(convertedPackagePath, filename),
        JSON.stringify(data, null, 2),
        'utf-8',
      );
    };

    const writes = [
      writeJson('package.json', {
        version: '2.0',
        format: 'json',
      }),
      writeJson('locales.json', result.locales),
      writeJson('foods.json', result.foods),
      writeJson('categories.json', result.categories),
      writeJson('nutrient-tables.json', result.nutrientTables),
      writeJson('enabled-local-foods.json', result.enabledLocalFoods),
    ];

    if (result.asServedSets)
      writes.push(writeJson('as-served-sets.json', result.asServedSets));

    await Promise.all(writes);
  }
}
