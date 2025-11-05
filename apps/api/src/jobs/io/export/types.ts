import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PackageDataStreams } from './package-export.service';

export type PackageWriter = (path: string, options: PackageExportOptions, dataStreams: PackageDataStreams) => Promise<void>;

export type PackageWriters = {
  [K in PackageExportOptions['format']]: PackageWriter;
};
