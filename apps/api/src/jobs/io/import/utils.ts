import path from 'node:path';

export function getVerifiedOutputPath(uploadDir: string, fileId: string): string {
  return path.join(uploadDir, `i24-pkg-import-${fileId}`);
}
