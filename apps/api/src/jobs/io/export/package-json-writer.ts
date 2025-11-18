import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { JsonStreamStringify } from 'json-stream-stringify';
import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PackageDataStreams } from './package-export.service';
import { PackageWriter, PackageWriterFactory } from './types';

export function createPackageJsonWriter(): PackageWriterFactory {
  return async (_outputPath: string, _exportOptions: PackageExportOptions): Promise<PackageWriter> => {
    return undefined as unknown as PackageWriter;
  };

  /*
  return async (_outputPath: string, _exportOptions: PackageExportOptions, packageStreams: PackageDataStreams): Promise<void> => {
    const tempDirPrefix = path.join(os.tmpdir(), 'i24pkg-');
    const tempDirPath = await fs.mkdtemp(tempDirPrefix);

    console.log(`Json Package Writer temp path: ${tempDirPath}`);

    const foods = Object.fromEntries(Object.entries(packageStreams.localeStreams)
      .filter(([_, localeStreams]) => localeStreams.foods !== undefined)
      .map(([localeId, localeStreams]) => [localeId, Readable.from(localeStreams.foods!)]));

    const jsonStream = new JsonStreamStringify(foods, undefined, 2);

    jsonStream.once('error', (err) => {
      throw err;
    });

    const outputFileStream = createWriteStream(path.join(tempDirPath, 'foods.json'), { flags: 'w' });

    await pipeline(jsonStream, outputFileStream);

    outputFileStream.on('error', (err) => {
      console.error('File write error:', err);
    });
  }; */
}
