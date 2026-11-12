import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    include: ['**/*.spec.?(c|m)[jt]s?(x)'],
  },
});
