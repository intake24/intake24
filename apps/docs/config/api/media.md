# Media

Path: Path: `apps/api/src/config/media.ts`

Media implementation supports the following storage:

- `Local` - stores media files on the local filesystem

## Storage Provider

Storage provider for media files.

- object-path: `storage.provider`
- dotenv var: `MEDIA_PROVIDER`
- type: `string`
- default: `'local'`

### Media public location

Storage location for public media files.

- object-path: `storage[provider].public`
- dotenv var: `MEDIA_PUBLIC`
- type: `string`
- default: `'storage/public/media'`

### Media private location

Storage location for private media files.

- object-path: `storage[provider].private`
- dotenv var: `MEDIA_PRIVATE`
- type: `string`
- default: `'storage/private/media'`

## Media Conversions

Media conversions are used to generate different formats of media files.

- object-path: `storage.conversions[conversion].width`
