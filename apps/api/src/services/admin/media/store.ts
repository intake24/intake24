import type { MediaDisk } from '@intake24/api/config';

export type MediaStore = {
  storeObject: (disk: MediaDisk, id: string, path: string) => Promise<void>;
  removeObject: (disk: MediaDisk, id: string) => Promise<void>;
};

/**
 * Generates the base path for media storage based on the media ID.
 * - The first two characters of the ID are used as a subdirectory.
 * - The ID itself is used as a subdirectory.
 *
 * @export
 * @param {string} id
 * @returns {string[]}
 */
export function baseObjectPath(id: string): string[] {
  return [id.slice(0, 2), id];
};
