import z from 'zod';

import { validateConfig } from '@intake24/common-backend';

import { msStringValue, parsedBytesStringValue } from './common';

export const localLocation = z.enum(['public', 'downloads', 'uploads', 'images', 'cache']);
export type LocalLocation = z.infer<typeof localLocation>;

export const fileSystemConfigSchema = z.object({
  local: z.object({
    public: z.string().nonempty().default('public'),
    downloads: z.string().nonempty().default('storage/private/downloads'),
    uploads: z.string().nonempty().default('storage/private/uploads'),
    images: z.string().nonempty().default('storage/public/images'),
    cache: z.string().nonempty().default('storage/private/cache'),
  }),
  urlExpiresAt: msStringValue,
  maxChunkedUploadSize: parsedBytesStringValue,
  lowDiskSpaceThreshold: parsedBytesStringValue,
});

export type FileSystemConfig = z.infer<typeof fileSystemConfigSchema>;

const rawFsConfig = {
  local: {
    public: process.env.FS_PUBLIC,
    downloads: process.env.FS_DOWNLOADS,
    uploads: process.env.FS_UPLOADS,
    images: process.env.FS_IMAGES,
    cache: process.env.FS_CACHE,
  },
  urlExpiresAt: '2d',
  maxChunkedUploadSize: process.env.FS_MAX_CHUNKED_UPLOAD_SIZE || '100MB',
  lowDiskSpaceThreshold: process.env.FS_LOW_DISK_SPACE_THRESHOLD || '10GB',
};

const parsedFsConfig = validateConfig('File system configuration', fileSystemConfigSchema, rawFsConfig);

export default parsedFsConfig;
