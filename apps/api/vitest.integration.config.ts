import { defineConfig, mergeConfig } from 'vitest/config';
import configShared from '../../packages/common/vitest.shared.js';

export default mergeConfig(
  configShared,
  defineConfig({
    test: {
      clearMocks: true,
      include: ['**/*.test.ts'],
      sequence: {
        concurrent: false,
      },
      setupFiles: ['../../packages/common/vitest.setup.js'],
    },
  }),
);
