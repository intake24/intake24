import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  cancel,
  confirm,
  group,
  intro,
  log,
  multiselect,
  note,
  outro,
  text,
} from '@clack/prompts';
import { ensureDir } from 'fs-extra';
import ky from 'ky';
import { throttle } from 'lodash';
import color from 'picocolors';
import unzipper from 'unzipper';
import config from '@intake24/cli/config';

type Asset = 'system' | 'foods' | 'images';
type InitAssetsArgs = {
  assets: Asset[];
  path: string;
};

const links: Record<Asset, { source: string; dest: string }> = {
  system: {
    source: 'https://storage.googleapis.com/intake24/snapshots/system_snapshot.sql',
    dest: 'system_snapshot.sql',
  },
  foods: {
    source: 'https://storage.googleapis.com/intake24/snapshots/foods_snapshot.pgcustom',
    dest: 'foods_snapshot.pgcustom',
  },
  images: {
    source: 'https://storage.googleapis.com/intake24/images/intake24-images-MRC-LIVE-19112025.zip',
    dest: 'images.zip',
  },
};

const throttleLog = throttle((msg: string) => log.info(msg), 1000);

async function initAssets({ assets, path }: InitAssetsArgs): Promise<void> {
  const pathExists = existsSync(path);
  if (!pathExists) {
    log.error(`Destination path "${path}" does not exist.`);
    process.exit(1);
  }

  for (const asset of assets) {
    const url = links[asset];
    const destPath = resolve(path, url.dest);

    log.info(`Downloading ${asset} asset from ${url.source} to ${destPath}.`);

    const response = await ky(url.source, {
      onDownloadProgress: (progress) => {
        throttleLog(`${(progress.percent * 100).toFixed(2)}%`);
      },
    });
    if (!response.ok || !response.body) {
      log.error(`Failed to download file from ${url.source}.`);
      log.error(`Error: ${response.status} ${response.statusText}`);
      continue;
    }

    try {
      await pipeline(
        Readable.fromWeb(response.body),
        createWriteStream(destPath),
      );
    }
    catch (error) {
      if (existsSync(destPath))
        await unlink(destPath);

      log.error(`Failed to download file from ${url.source}`);
      if (error instanceof Error)
        log.error(`${error.message}`);

      continue;
    }

    log.success(`Downloaded ${asset} asset to ${destPath}`);
  }

  log.success('Initial assets downloaded and prepared.');
}

async function extractImages(): Promise<void> {
  const extractImages = await confirm({
    message: 'Do you want to extract food images?',
    initialValue: false,
  });

  if (!extractImages)
    return;

  const archivePath = resolve(links.images.dest);
  const pathExists = existsSync(archivePath);
  if (!pathExists) {
    log.error(`Archive path "${archivePath}" does not exist.`);
    return;
  }

  const targetDir = resolve('../api', config.filesystem.local.images);
  await ensureDir(targetDir);
  log.step(`Extracting files to ${targetDir}...`);

  await pipeline(
    createReadStream(archivePath),
    unzipper.Extract({ path: targetDir }),
  );
  log.info(`Images are saved to: ${targetDir}`);

  await unlink(archivePath);
  log.info('Temporary archive file removed.');
  log.success(`Images extracted to ${targetDir}`);
}

export default async (): Promise<void> => {
  intro(color.bgCyanBright(color.black('Download assets.')));

  const input = await group(
    {
      assets: () =>
        multiselect({
          message: 'Which assets do you want to download?',
          options: [
            { value: 'system', label: 'System snapshot' },
            { value: 'foods', label: 'Foods snapshot' },
            { value: 'images', label: 'Food images' },
          ],
          required: true,
        }),
      path: () =>
        text({
          message: 'Where do you want to download the assets to?',
          validate: (value) => {
            if (!value.trim())
              return 'Path cannot be empty';
          },
        }),
    },
    {
      onCancel: () => {
        cancel('Operation cancelled.');
        process.exit(0);
      },
    },
  );

  note(`Data will be downloaded to: ${resolve(input.path)}`);

  const canProceed = await confirm(
    {
      message: 'Do you want to initiate the asset download?',
      initialValue: true,
    },
  );
  if (!canProceed)
    return;

  await initAssets(input);
  await extractImages();
  outro(color.green('Assets setup completed successfully.'));
};
