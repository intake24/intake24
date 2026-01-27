import type { IoC } from '@intake24/api/ioc';

import fs from 'fs-extra';

export default class Filesystem {
  private readonly fsConfig;

  constructor({ fsConfig }: Pick<IoC, 'fsConfig'>) {
    this.fsConfig = fsConfig;
  }

  /**
   * Initialize filesystem
   *
   * @returns {Promise<void>}
   * @memberof Filesystem
   */
  public async init(): Promise<void> {
    for (const dir of Object.values(this.fsConfig.local))
      await fs.ensureDir(dir);
  }
}
