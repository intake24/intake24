# Filesystem

Path: `apps/api/src/config/filesystem.ts`

## Public dir

Public directory for serving static files.

- object-path: `local.public`
- dotenv var: `FS_PUBLIC`
- type: `string`
- default: `'public'`

## Upload dir

Upload directory for storing temporarily uploaded files.

- object-path: `local.uploads`
- dotenv var: `FS_UPLOADS`
- type: `string`
- default: `'storage/private/uploads'`

## Download dir

Download directory for storing temporarily downloaded files.

- object-path: `local.downloads`
- dotenv var: `FS_DOWNLOADS`
- type: `string`
- default: `'storage/private/downloads'`

## Images dir

Images directory for locally hosted images.

- object-path: `local.images`
- dotenv var: `FS_IMAGES`
- type: `string`
- default: `'storage/public/images'`

## Cache dir

Cache directory for locally cached files.

- object-path: `local.cache`
- dotenv var: `FS_CACHE`
- type: `string`
- default: `'storage/private/cache'`

## URL Expiration

Expiration of URLs for generated files. Defined as `ms-formatted`string, see [ms](https://github.com/vercel/ms) for more information.

- object-path: `urlExpiresAt`
- type: `string`
- default: `'2d'`

## Max chunked upload size

Maximum size of a file uploaded in chunks. Defined as `bytes-formatted` string (e.g. `'100MB'`), see [bytes](https://github.com/visionmedia/bytes.js) for more information.

- object-path: `maxChunkedUploadSize`
- dotenv var: `FS_MAX_CHUNKED_UPLOAD_SIZE`
- type: `string`
- default: `'100MB'`

## Low disk space threshold

Minimum free disk space required to accept chunked uploads and package exports. Defined as `bytes-formatted` string (e.g. `'10GB'`), see [bytes](https://github.com/visionmedia/bytes.js) for more information.

- object-path: `lowDiskSpaceThreshold`
- dotenv var: `FS_LOW_DISK_SPACE_THRESHOLD`
- type: `string`
- default: `'10GB'`
