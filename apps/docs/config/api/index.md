# Introduction

Configuration files are stored in `src/config` directory of `application` or `package`.

Configuration is structured to following sections:

- [Application](/config/api/application)
- [Access Control List (ACL)](/config/api/acl)
- [Cache](/config/api/cache)
- [Database](/config/api/database)
- [Filesystem](/config/api/filesystem)
- [Image processing](/config/api/images)
- [Logging](/config/api/log)
- [Mail](/config/api/mail)
- [Media](/config/api/media)
- [Metrics](/config/api/metrics)
- [Package import / export](/config/api/package-io)
- [PDF generation](/config/api/pdf)
- [Pub-sub](/config/api/pub-sub)
- [Queue](/config/api/queue)
- [Rate limiter](/config/api/rate-limiter)
- [Security](/config/api/security)
- [Services](/config/api/services)
- [Session](/config/api/session)

## Redis

[Redis](https://redis.io) is used by several parts of the system ([cache](/config/api/cache), [pub-sub](/config/api/pub-sub), [queue](/config/api/queue), [rate limiter](/config/api/rate-limiter), [session](/config/api/session)). Each of them has its own `{SECTION}_REDIS_*` connection settings, so they can be configured independently if needed.

Common connection settings below are used as a fallback for any section, which does not define its own `{SECTION}_REDIS_*` variable.

### URL

Connection URL, e.g. `redis://localhost:6379/0`. Takes precedence over host / port / database settings.

- dotenv var: `REDIS_URL`
- type: `string`
- default: `undefined`

### Host

- dotenv var: `REDIS_HOST`
- type: `string`
- default: `'localhost'`

### Port

- dotenv var: `REDIS_PORT`
- type: `number`
- default: `6379`

### Database

- dotenv var: `REDIS_DATABASE`
- type: `number`
- default: `0`
