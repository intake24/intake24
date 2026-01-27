import type { MediaStore } from './store';
import type { MediaDisk } from '@intake24/api/config';
import type { IoC } from '@intake24/api/ioc';

import { join, resolve } from 'node:path';

import { move, remove } from 'fs-extra';

import { baseObjectPath } from './store';

function localMediaStore({ logger: globalLogger, mediaConfig }: Pick<IoC, 'mediaConfig' | 'kyselyDb' | 'logger'>): MediaStore {
  const logger = globalLogger.child({ service: 'LocalMediaStore' });

  const getBasePath = (disk: MediaDisk, id: string): string[] => {
    return [mediaConfig.storage.local[disk], ...baseObjectPath(id)];
  };

  const storeObject = async (disk: MediaDisk, id: string, path: string) => {
    await move(resolve(path), resolve(...getBasePath(disk, id)), { overwrite: true });

    logger.debug('Media object stored.', { disk, id, path });
  };

  const removeObject = async (disk: MediaDisk, id: string) => {
    await remove(join(...getBasePath(disk, id)));

    logger.debug('Media object removed.', { disk, id });
  };

  return {
    storeObject,
    removeObject,
  };
}

export default localMediaStore;

export type LocalMediaStore = ReturnType<typeof localMediaStore>;
