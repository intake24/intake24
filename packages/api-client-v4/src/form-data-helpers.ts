import type { File } from 'formdata-node';

import { fileFromPath } from 'formdata-node/file-from-path';
import { lookup as mimeLookup } from 'mime-types';

export async function fileFromPathWithType(filePath: string): Promise<File> {
  const mimeType = mimeLookup(filePath);
  return fileFromPath(filePath, {
    type: mimeType === false ? undefined : mimeType,
  });
}
