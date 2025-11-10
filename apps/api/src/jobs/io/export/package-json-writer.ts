import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { JsonStreamStringify } from 'json-stream-stringify';
import { PackageExportOptions } from '@intake24/common/types/http/admin';
import { PackageDataStreams } from './package-export.service';

export function createPackageJsonWriter() {
  return async (_outputPath: string, _exportOptions: PackageExportOptions, packageStreams: PackageDataStreams): Promise<void> => {
    const tempDirPrefix = path.join(os.tmpdir(), 'i24pkg-');
    const tempDirPath = await fs.mkdtemp(tempDirPrefix);

    const foods = Object.fromEntries(Object.entries(packageStreams)
      .filter(([_, localeStreams]) => localeStreams.foods !== undefined)
      .map(([localeId, localeStreams]) => [localeId, Readable.from(localeStreams.foods!)]));

    console.log(foods);

    const jsonStream = new JsonStreamStringify(foods, undefined, 2);

    jsonStream.once('error', (err) => {
      console.error('Stringify error at path:', '', err);
    });

    const outputFileStream = createWriteStream(path.join(tempDirPath, 'foods.json'), { flags: 'w' });

    console.log(`Json Package Writer: ${tempDirPath}`);

    await pipeline(jsonStream, outputFileStream);

    outputFileStream.on('error', (err) => {
      console.error('File write error:', err);
    });
  };
}
