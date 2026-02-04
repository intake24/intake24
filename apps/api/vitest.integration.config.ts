import { defineConfig, mergeConfig } from 'vitest/config';

import configShared from '../../packages/common/vitest.shared.js';

export default mergeConfig(
  configShared,
  defineConfig({
    server: {
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/__tests__/tmp/**'],
      },
    },
    test: {
      clearMocks: true,
      hookTimeout: 30000,
      include: ['**/*.test.ts'],
      sequence: {
        concurrent: false,
      },
      setupFiles: ['../../packages/common/vitest.setup.js'],
    },
  }),
);
