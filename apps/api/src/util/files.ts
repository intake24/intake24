import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import archiver from 'archiver';

/**
 * Zips the contents of a directory directly to the root of the archive, preserving all subdirectories.
 */
export async function zipDirectory(sourceDir: string, zipFileName: string): Promise<void> {
  const archive = archiver('zip', {
    zlib: { level: 6 },
  });

  const output = fsSync.createWriteStream(zipFileName);

  return new Promise((resolve, reject) => {
    archive
      .directory(sourceDir, false)
      .on('error', err => reject(err))
      .pipe(output);

    output.on('close', () => {
      resolve();
    });

    archive.finalize();
  });
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
