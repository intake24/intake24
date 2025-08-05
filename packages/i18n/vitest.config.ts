import { defineConfig, mergeConfig } from 'vitest/config';
import configShared from '../common/vitest.shared.js';

export default mergeConfig(
  configShared,
  defineConfig({
    test: {
      setupFiles: ['../common/vitest.setup.js'],
    },
  }),
);
