import type {
  PackageHandler,
  PackageHandlerContext,
  PackageVerificationResult,
} from './types';

import fs from 'node:fs/promises';

import * as yauzl from 'yauzl';
import { z } from 'zod';

import { LocalisableError } from '@intake24/api/http/errors';

import { unzipFile } from '../../../util/files';
import { getVerifiedOutputPath } from '../import/utils';
import { PackageValidationFileErrors } from './types';
import { getFileValidationErrorMessages, validateJsonFiles } from './validate-json-files';

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
}
