import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/{common,common-backend,i18n}', 'apps/api'],
  },
});
