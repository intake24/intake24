import { defineConfig } from 'kysely-codegen';

export default defineConfig({
  camelCase: true,
  dialect: 'postgres',
  url: 'env(DB_DEV_SYSTEM_URL)',
  envFile: '../../apps/api/.env',
  outFile: './src/kysely/system.d.ts',
});
