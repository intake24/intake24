import fs from 'node:fs/promises';
import path from 'node:path';

import { LocalisableError } from '@intake24/api/http/errors';
import { uploadFileId } from '@intake24/common/types/http/admin';

export function getVerifiedOutputPath(uploadDir: string, fileId: string): string {
  return path.join(uploadDir, `i24-pkg-import-${fileId}`);
}

function uploadedFileNotAccessible(cause?: unknown): LocalisableError {
  return new LocalisableError(
    'io.verification.uploadedFileNotAccessible',
    undefined,
    cause === undefined ? undefined : { cause },
  );
}

/**
 * Resolve a TUS upload without allowing its request-provided ID to escape the flat upload root.
 * Reject symlinks as well as non-files so subsequent reads and cleanup act on the same kind of
 * object that the TUS file store creates.
 */
export async function safeResolveUploadedFilePath(uploadDir: string, fileId: string): Promise<string> {
  if (!uploadFileId.safeParse(fileId).success)
    throw uploadedFileNotAccessible();

  try {
    const root = await fs.realpath(path.resolve(uploadDir));
    const candidate = path.join(root, fileId);
    const stats = await fs.lstat(candidate);

    if (!stats.isFile() || stats.isSymbolicLink())
      throw uploadedFileNotAccessible();

    const resolved = await fs.realpath(candidate);
    if (path.dirname(resolved) !== root)
      throw uploadedFileNotAccessible();

    return resolved;
  }
  catch (err) {
    if (err instanceof LocalisableError)
      throw err;

    throw uploadedFileNotAccessible(err);
  }
}
