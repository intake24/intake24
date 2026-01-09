import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/commands/*.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Temporarily disable DTS generation
  clean: true,
  sourcemap: true,
  external: [
    '@intake24/api-client-v4',
    '@intake24/common',
    '@intake24/common-backend',
    '@intake24/db',
    '@intake24/excel-reader',
  ],
});
