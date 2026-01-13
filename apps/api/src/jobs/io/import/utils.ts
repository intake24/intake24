import os from 'node:os';
import path from 'node:path';

export function getVerifiedOutputPath(fileId: string): string {
  return path.join(os.tmpdir(), `i24-pkg-import-${fileId}`);
}
