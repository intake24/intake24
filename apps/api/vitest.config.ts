import { config } from 'dotenv';
import { defineConfig, mergeConfig } from 'vitest/config';
import configShared from '../../packages/common/vitest.shared.js';

export default mergeConfig(
  configShared,
  defineConfig({
    test: {
      setupFiles: ['../../packages/common/vitest.setup.js'],
      env: {
        ...config({ path: './__tests__/.env-test' }).parsed,
      },
    },
  }),
);
