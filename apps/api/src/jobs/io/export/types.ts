import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PkgV2AsServedSet } from '@intake24/common/types/package/as-served';
import { PkgV2Food } from '@intake24/common/types/package/foods';

export interface PackageWriter
{
  writeFood: (localeId: string, food: PkgV2Food) => Promise<void>;
  writeAsServedSet: (asServedSet: PkgV2AsServedSet) => Promise<void>;
  finish: () => Promise<void>;
}

export type PackageWriterFactory = (path: string, options: PackageExportOptions) => Promise<PackageWriter>;

export type PackageWriters = {
  [K in PackageExportOptions['format']]: PackageWriterFactory;
};
