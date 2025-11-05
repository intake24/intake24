import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PackageDataStreams } from './package-export.service';

export function createPackageXlsxWriter() {
  return async (_outputPath: string, _exportOptions: PackageExportOptions, _packageStreams: PackageDataStreams): Promise<void> => {
  };
}
