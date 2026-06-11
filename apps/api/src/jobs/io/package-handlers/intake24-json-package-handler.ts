import type {
  PackageHandler,
  PackageHandlerContext,
  PackageVerificationResult,
} from './types';

import fs from 'node:fs/promises';

import { unzipFile } from '../../../util/files';
import { getVerifiedOutputPath } from '../import/utils';
import { validatePackageMeta } from './package-meta';
import { PackageValidationFileErrors } from './types';
import { getFileValidationErrorMessages, validateJsonFiles } from './validate-json-files';

export class Intake24JsonPackageHandler implements PackageHandler {
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

    const packageContents = await validateJsonFiles(this.extractedPath);

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

    if (packageContents.synonymSets) {
      Object.keys(packageContents.synonymSets).forEach(locale => targetLocales.add(locale));
    }

    return {
      extractedPath: this.extractedPath,
      summary: {
        targetLocales: [...targetLocales],
        files: {
          locales: !!packageContents.locales,
          foods: !!packageContents.foods,
          categories: !!packageContents.categories,
          synonymSets: !!packageContents.synonymSets,
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
    await validatePackageMeta(uploadedPath, 'json');
  }
}
