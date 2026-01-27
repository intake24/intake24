import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    server: './src/index.ts',
    foodIndex: './src/food-index/workers/index-builder.ts',
  },
  name: 'API',
  sourcemap: true,
  inlineOnly: false,
});
