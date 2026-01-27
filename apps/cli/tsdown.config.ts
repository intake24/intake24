import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    cli: 'src/index.ts',
  },
  name: 'CLI',
  sourcemap: true,
  inlineOnly: false,
});
