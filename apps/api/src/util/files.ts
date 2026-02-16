import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import * as yauzl from 'yauzl';
import { ZipFile } from 'yazl';

/**
 * Zips the contents of a directory directly to the root of the archive, preserving all subdirectories.
 */
export async function zipDirectory(sourceDir: string, zipFileName: string): Promise<void> {
  const zipfile = new ZipFile();
  const output = fsSync.createWriteStream(zipFileName);

  const streamPromise = new Promise<void>((resolve, reject) => {
    zipfile.outputStream.pipe(output).on('close', resolve);
    zipfile.outputStream.on('error', reject);
  });

  const files = await fs.readdir(sourceDir, { recursive: true, withFileTypes: true });

  for (const file of files) {
    if (file.isFile()) {
      const fullPath = path.join(file.parentPath, file.name);
      const relativePath = path.relative(sourceDir, fullPath);
      zipfile.addFile(fullPath, relativePath);
    }
  }

  zipfile.end();
  await streamPromise;
}

/**
 * Creates an empty file with the given filename. If the file already exists,
 * appends a suffix like -2, -3, etc., before the extension until a unique name is found.
 *
 * Max 10 attempts before failing.
 */
export async function createUniqueEmptyFile(filePath: string): Promise<string> {
  let currentPath = filePath;
  let counter = 2;
  let attempts = 0;
  const maxAttempts = 10;

  const parsed = path.parse(filePath);
  const dir = parsed.dir;
  const name = parsed.name;
  const ext = parsed.ext;

  while (attempts < maxAttempts) {
    ++attempts;
    try {
      const handle = await fs.open(currentPath, 'wx');
      await handle.close();
      return currentPath;
    }
    catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
        currentPath = path.join(dir, `${name}-${counter}${ext}`);
        counter++;
      }
      else {
        throw err;
      }
    }
  }

  throw new Error(`Unable to create a unique file after ${maxAttempts} attempts.`);
}

/**
 * Unzips a file to a destination directory.
 */
export async function unzipFile(zipFilePath: string, destinationDir: string): Promise<void> {
  let zipfile: yauzl.ZipFile;

  try {
    zipfile = await new Promise<yauzl.ZipFile>((resolve, reject) => {
      yauzl.open(zipFilePath, { lazyEntries: true }, (err, zf) => {
        if (err || !zf)
          reject(err || new Error('Failed to open zip file'));
        else resolve(zf);
      });
    });
  }
  catch (err) {
    throw new Error(`Invalid zip file: ${(err as Error).message}`);
  }

  try {
    await fs.mkdir(destinationDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      zipfile.readEntry();
      zipfile.on('entry', async (entry: yauzl.Entry) => {
        // Check for unsafe characters in filename
        if (entry.fileName.includes('..')) {
          return reject(new Error('Unexpected entry (\'..\') detected in zip file'));
        }

        if (/\/$/.test(entry.fileName)) {
          // Directory file names end with '/'
          try {
            await fs.mkdir(path.join(destinationDir, entry.fileName), { recursive: true });
            zipfile.readEntry();
          }
          catch (err) {
            reject(err);
          }
        }
        else {
          // file entry
          zipfile.openReadStream(entry, async (err, readStream) => {
            if (err)
              return reject(err);
            if (!readStream)
              return reject(new Error('Failed to create read stream'));

            const outputDir = path.dirname(path.join(destinationDir, entry.fileName));
            await fs.mkdir(outputDir, { recursive: true });

            const writeStream = fsSync.createWriteStream(path.join(destinationDir, entry.fileName));

            writeStream.on('close', () => zipfile.readEntry());
            readStream.on('error', reject);
            writeStream.on('error', reject);
            readStream.pipe(writeStream);
          });
        }
      });
      zipfile.on('end', resolve);
      zipfile.on('error', reject);
    });
  }
  finally {
    zipfile.close();
  }
}
