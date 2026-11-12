import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

import configShared from '../../packages/common/vitest.shared.js';

const sharedTestConfig = {
  globals: true,
  setupFiles: ['../../packages/common/vitest.setup.js'],
  env: config({
    path: fileURLToPath(new URL('./__tests__/.env-test', import.meta.url)),
  }).parsed,
};

const dbUnitTests = [
  '__tests__/unit/food-data/food-data.spec.ts',
  '__tests__/unit/services/food/bulk-update.spec.ts',
  '__tests__/unit/services/category/bulk-update.spec.ts',
];

export default defineConfig({
  test: {
    projects: [
      {
        resolve: configShared.resolve,
        test: {
          ...sharedTestConfig,
          name: 'unit',
          include: ['**/*.spec.?(c|m)[jt]s?(x)'],
          exclude: ['**/node_modules/**', '**/.git/**', ...dbUnitTests],
        },
      },
      {
        resolve: configShared.resolve,
        test: {
          ...sharedTestConfig,
          name: 'db-unit',
          fileParallelism: false,
          include: dbUnitTests,
        },
      },
    ],
  },
});
