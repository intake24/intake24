import { config } from 'dotenv';
import { defineConfig, mergeConfig } from 'vitest/config';

import configShared from '../../packages/common/vitest.shared.js';

export default mergeConfig(
  configShared,
  defineConfig({
    test: {
      fileParallelism: false, // Temporary fix to prevent database-dependent unit tests from conflicting
      setupFiles: ['../../packages/common/vitest.setup.js'],
      env: {
        ...config({ path: './__tests__/.env-test' }).parsed,
      },
    },
  }),
);
