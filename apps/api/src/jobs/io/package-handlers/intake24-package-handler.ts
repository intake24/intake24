import type {
  PackageHandler,
  PackageHandlerContext,
  PackageVerificationResult,
} from './types';

import { Intake24JsonPackageHandler } from './intake24-json-package-handler';
import { Intake24XlsxPackageHandler } from './intake24-xlsx-package-handler';
import { readPackageMeta } from './package-meta';
import { PackageValidationFileErrors } from './types';
import { getFileValidationErrorMessages } from './validate-json-files';

export class Intake24PackageHandler implements PackageHandler {
  private readonly context: PackageHandlerContext;
  private delegate?: PackageHandler;

  constructor(context: PackageHandlerContext) {
    this.context = context;
  }

  async verify(uploadedPath: string): Promise<PackageVerificationResult> {
    try {
      const { format } = await readPackageMeta(uploadedPath);
      this.delegate = format === 'xlsx'
        ? new Intake24XlsxPackageHandler(this.context)
        : new Intake24JsonPackageHandler(this.context);

      return await this.delegate.verify(uploadedPath);
    }
    catch (err) {
      if (err instanceof PackageValidationFileErrors)
        throw err;

      throw new PackageValidationFileErrors({ _uploadedFile: getFileValidationErrorMessages(err) });
    }
  }

  async cleanup(): Promise<void> {
    await this.delegate?.cleanup();
  }
}
