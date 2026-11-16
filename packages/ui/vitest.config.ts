import { fileURLToPath, URL } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';

import configShared from '../common/vitest.shared.js';

export default mergeConfig(
  configShared,
  defineConfig({
    resolve: {
      alias: {
        '@intake24/common': fileURLToPath(new URL('../common/src', import.meta.url)),
        '@intake24/i18n': fileURLToPath(new URL('../i18n/src', import.meta.url)),
        '@intake24/ui': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      environment: 'jsdom',
    },
  }),
);
