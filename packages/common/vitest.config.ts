import { defineConfig, mergeConfig } from 'vitest/config';
import configShared from '../../packages/common/vitest.shared.js';

export default mergeConfig(
  configShared,
  defineConfig({
    test: {
      setupFiles: ['./vitest.setup.js'],
    },
  }),
);
