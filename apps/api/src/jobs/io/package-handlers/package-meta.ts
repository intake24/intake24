import * as yauzl from 'yauzl';
import { z } from 'zod';

import { LocalisableError } from '@intake24/api/http/errors';

const xlsxWorkbookPathsSchema = z.object({
  foods: z.record(z.string(), z.string()).optional(),
  categories: z.record(z.string(), z.string()).optional(),
}).optional();

const packageMetaSchema = z.discriminatedUnion('format', [
  z.object({
    version: z.string(),
    format: z.literal('json'),
  }),
  z.object({
    version: z.string(),
    format: z.literal('xlsx'),
    workbookPaths: xlsxWorkbookPathsSchema,
  }),
]);

export type PackageMeta = z.infer<typeof packageMetaSchema>;
export type XlsxPackageMeta = Extract<PackageMeta, { format: 'xlsx' }>;

export async function readPackageMeta(uploadedPath: string): Promise<PackageMeta> {
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
        if (!found)
          reject(new LocalisableError('io.verification.packageJsonNotFound'));
      });
      zipfile.on('error', err => reject(new LocalisableError('io.verification.invalidZipFile', undefined, { cause: err })));
    });

    return packageMetaSchema.parse(JSON.parse(packageJsonContent));
  }
  finally {
    zipfile.close();
  }
}

export async function validatePackageMeta(uploadedPath: string, format: PackageMeta['format']): Promise<PackageMeta> {
  const packageMeta = await readPackageMeta(uploadedPath);

  z.object({
    version: z.string(),
    format: z.literal(format),
  }).parse(packageMeta);

  return packageMeta;
}
