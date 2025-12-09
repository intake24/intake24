import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
} from '@clack/prompts';

import fs from 'fs-extra';
import color from 'picocolors';
import unzipper from 'unzipper';
import config from '@intake24/cli/config';

export type InitFoodImagesArgs = { url: string };

export default async (cmd: InitFoodImagesArgs): Promise<void> => {
  intro(color.cyan('Initialize food images from a zip file URL'));
  const { url } = cmd;
  log.info(`Will download file from: ${url}`);

  const filename = url.split('/').pop() ?? 'food-images.zip';
  const outputPath = path.join(process.cwd(), filename);

  let response: Response;
  try {
    response = await fetch(url);
  }
  catch (error) {
    log.error(`Failed to download file from ${url}: ${(error as Error).message}`);
    return;
  }

  if (!response.ok || !response.body) {
    log.error(`Failed to download file from ${url}: ${response.status} ${response.statusText}`);
    return;
  }

  const shouldContinue = await confirm({
    message: 'Existing food images will be overwritten or merged. Do you want to continue?',
  });

  if (!shouldContinue || isCancel(shouldContinue)) {
    cancel('Operation cancelled');
    return;
  }
  log.info('Starting downloading..');
  const input = Readable.fromWeb(response.body);
  const output = fs.createWriteStream(outputPath);

  const totalBytes = Number(response.headers.get('content-length') ?? 0);

  const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes))
      return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let num = bytes;
    while (num >= 1024 && i < units.length - 1) {
      num /= 1024;
      i++;
    }
    return `${num.toFixed(num >= 100 ? 0 : num >= 10 ? 1 : 2)} ${units[i]}`;
  };

  let downloaded = 0;
  const start = Date.now();
  let lastLogged = 0;

  const dl_progress = new Transform({
    transform(chunk, _enc, cb) {
      downloaded += chunk.length;
      const now = Date.now();
      if (now - lastLogged >= 200) {
        const elapsed = Math.max(1, now - start) / 1000; // seconds
        const speed = downloaded / elapsed; // B/s average
        const percent = totalBytes ? (downloaded / totalBytes) * 100 : 0;
        const line = totalBytes
          ? `Downloading: ${formatBytes(downloaded)} / ${formatBytes(totalBytes)} (${percent.toFixed(1)}%) at ${formatBytes(speed)}/s`
          : `Downloading: ${formatBytes(downloaded)} at ${formatBytes(speed)}/s`;
        if (process.stdout.isTTY)
          process.stdout.write(`\r${line}`);
        else log.info(line);
        lastLogged = now;
      }
      cb(null, chunk);
    },
    flush(cb) {
      const elapsed = Math.max(1, Date.now() - start) / 1000;
      const avgSpeed = downloaded / elapsed;
      const finalLine = totalBytes
        ? `Downloaded ${formatBytes(downloaded)} in ${elapsed.toFixed(1)}s (${formatBytes(avgSpeed)}/s)`
        : `Downloaded ${formatBytes(downloaded)} in ${elapsed.toFixed(1)}s (${formatBytes(avgSpeed)}/s)`;
      if (process.stdout.isTTY)
        process.stdout.write(`\r${finalLine}\n`);
      else log.info(finalLine);
      cb();
    },
  });

  await pipeline(input, dl_progress, output);
  log.success(`File downloaded to ${outputPath}`);

  const targetDir = `../api/${config.filesystem.local.images}`;
  await fs.ensureDir(targetDir);
  log.step(`Extracting files to ${targetDir}...`);
  await fs
    .createReadStream(outputPath)
    .pipe(unzipper.Extract({ path: targetDir }))
    .promise();
  log.success('Extraction complete.');
  log.success(`Images have saved to: ${path.resolve(process.cwd(), targetDir)}`);
  outro(`Food images can now be used in the API.`);
  await unlink(outputPath);
};
