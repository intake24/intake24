import z from 'zod';

import { msStringValue } from './common';
import { validateConfig } from './validate-config';

export const localLocationSchema = z.enum(['public', 'downloads', 'uploads', 'images']);

export type LocalLocation = z.infer<typeof localLocationSchema>;

export const fileSystemConfigSchema = z.object({
  local: z.object({
    public: z.string().nonempty(),
    downloads: z.string().nonempty(),
    uploads: z.string().nonempty(),
    images: z.string().nonempty(),
  }),
  urlExpiresAt: msStringValue,
});

export type FileSystemConfig = z.infer<typeof fileSystemConfigSchema>;

const rawFsConfig = {
  local: {
    public: process.env.FS_PUBLIC || 'public',
    downloads: process.env.FS_DOWNLOADS || 'storage/private/downloads',
    uploads: process.env.FS_UPLOADS || 'storage/private/uploads',
    images: process.env.FS_IMAGES || 'storage/public/images',
  },
  urlExpiresAt: '2d',
};

const parsedFsConfig = validateConfig('File system configuration', fileSystemConfigSchema, rawFsConfig);

export default parsedFsConfig;
