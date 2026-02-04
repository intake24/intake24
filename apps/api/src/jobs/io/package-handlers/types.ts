import type { IoC } from '../../../ioc';
import type { Dictionary } from '@intake24/common/types';
import type { PackageContentsSummary } from '@intake24/common/types/http/admin/io';

export type FileValidationErrorMessage = {
  key: string;
  params?: Record<string, string | number>;
};

export class PackageValidationFileErrors extends Error {
  public readonly details: {
    fileErrors: Dictionary<FileValidationErrorMessage[]>;
  };

  constructor(fileErrors: Dictionary<FileValidationErrorMessage[]>) {
    super('Package validation file errors');
    this.details = { fileErrors };
  }
}

export interface PackageHandlerContext {
  fileId: string;
  userId: string;
  uploadDir: string;
  logger: IoC['logger'];
  globalAclService: IoC['globalAclService'];
}

export interface PackageVerificationResult {
  summary: PackageContentsSummary;
  extractedPath: string;
}

export interface PackageHandler {
  verify: (uploadedPath: string) => Promise<PackageVerificationResult>;
  cleanup: () => Promise<void>;
}
