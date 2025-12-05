import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import decompress from 'decompress';
import fs from 'fs-extra';
import config from '@intake24/api/config';

export type InitFoodImagesArgs = { url: string };

export default async (cmd: InitFoodImagesArgs): Promise<void> => {
  const { url } = cmd;
  console.log(`Downloading file from: ${url}`);

  const filename = url.split('/').pop() ?? 'food-images.zip';
  const outputPath = path.join(process.cwd(), filename);

  const response = await fetch(url);
  if (!response.ok || !response.body)
    throw new Error(`Failed to download file from ${url}: ${response.statusText}`);

  const input = Readable.fromWeb(response.body);
  const output = fs.createWriteStream(outputPath);

  await pipeline(input, output);
  const targetDir = `../api/${config.filesystem.local.images}`;
  await fs.ensureDir(targetDir);
  await decompress(outputPath, targetDir);
  await unlink(outputPath);

  console.log(`File downloaded to ${outputPath}`);
};
