import z from 'zod';

import { validateConfig } from '@intake24/common-backend';

export const packageIoConfigSchema = z.object({
  instantIndexRebuild: z.boolean().or(z.stringbool()).default(false),
});

export type PackageIoConfig = z.infer<typeof packageIoConfigSchema>;

const rawPackageIoConfig = {
  instantIndexRebuild: process.env.PACKAGE_IMPORT_INSTANT_INDEX_REBUILD,
};

const parsedPackageIoConfig = validateConfig(
  'Package IO configuration',
  packageIoConfigSchema,
  rawPackageIoConfig,
);

export default parsedPackageIoConfig;
