import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

import configShared from '../../packages/common/vitest.shared.js';

const sharedTestConfig = {
  globals: true,
  setupFiles: ['../../packages/common/vitest.setup.js'],
  env: config({ path: './__tests__/.env-test' }).parsed,
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
        plugins: configShared.plugins,
        test: {
          ...sharedTestConfig,
          name: 'unit',
          include: ['**/*.spec.?(c|m)[jt]s?(x)'],
          exclude: ['**/node_modules/**', '**/.git/**', ...dbUnitTests],
        },
      },
      {
        plugins: configShared.plugins,
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
