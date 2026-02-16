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
import { getFileValidationErrorMessages, validateJsonFiles } from './validate-json-files';

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

    let convertedPath: string;
    try {
      convertedPath = await this.convertPackage(albaneExtractedPath, uploadDir, fileId, logger);
      this.convertedPackagePath = convertedPath;
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

    // This *should* be guaranteed by the type system, but validation is not very expensive so we'll just do it anyway
    const packageContents = await validateJsonFiles(convertedPath);

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
      extractedPath: convertedPath,
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
  ): Promise<string> {
    const convertedPackagePath = getVerifiedOutputPath(uploadDir, fileId);

    await fs.mkdir(convertedPackagePath, { recursive: true });

    const builder = new AlbaneLocaleBuilder(logger, albaneExtractedPath, this.context.servicesConfig.deepl, this.context.cacheDir);
    const conversionResult = await builder.buildPackage();

    await this.writeConvertedPackage(convertedPackagePath, conversionResult);

    return convertedPackagePath;
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
