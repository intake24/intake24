import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import fs from 'fs-extra';

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
  // TODO : extract to configured location
  // extractToDirectory(outputPath, config.filesystem.local.images);
  await unlink(outputPath);

  console.log(`File downloaded to ${outputPath}`);
};
