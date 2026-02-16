import z from 'zod';

import { msStringValue, parsedBytesStringValue } from './common';
import { validateConfig } from './validate-config';

export const localLocationSchema = z.enum(['public', 'downloads', 'uploads', 'images']);

export type LocalLocation = z.infer<typeof localLocationSchema>;

export const fileSystemConfigSchema = z.object({
  local: z.object({
    public: z.string().nonempty(),
    downloads: z.string().nonempty(),
    uploads: z.string().nonempty(),
    images: z.string().nonempty(),
    cache: z.string().nonempty(),
  }),
  urlExpiresAt: msStringValue,
  maxChunkedUploadSize: parsedBytesStringValue,
  lowDiskSpaceThreshold: parsedBytesStringValue,
});

export type FileSystemConfig = z.infer<typeof fileSystemConfigSchema>;

const rawFsConfig = {
  local: {
    public: process.env.FS_PUBLIC || 'public',
    downloads: process.env.FS_DOWNLOADS || 'storage/private/downloads',
    uploads: process.env.FS_UPLOADS || 'storage/private/uploads',
    images: process.env.FS_IMAGES || 'storage/public/images',
    cache: process.env.FS_CACHE || 'storage/private/cache',
  },
  urlExpiresAt: '2d',
  maxChunkedUploadSize: process.env.FS_MAX_CHUNKED_UPLOAD_SIZE || '100MB',
  lowDiskSpaceThreshold: process.env.FS_LOW_DISK_SPACE_THRESHOLD || '10GB',
};

const parsedFsConfig = validateConfig('File system configuration', fileSystemConfigSchema, rawFsConfig);

export default parsedFsConfig;
