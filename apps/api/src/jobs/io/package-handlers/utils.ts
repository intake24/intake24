import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeJsonFile(outputPath: string, filename: string, data: unknown): Promise<void> {
  await fs.writeFile(
    path.join(outputPath, filename),
    JSON.stringify(data, null, 2),
    'utf-8',
  );
}
