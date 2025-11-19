# Cache

Path: `apps/api/src/config/cache.ts`

[Redis](https://redis.io) is used as cache store driver.

Redis is also used for other parts of system (queue, rate limiter, session), they have separate connection settings, so they can be configured independently if needed.

## Redis instance

### URL

- object-path: `redis.url`
- dotenv var: `CACHE_REDIS_URL | REDIS_URL`
- type: `string`
- default: `undefined`

### Host

- object-path: `redis.host`
- dotenv var: `CACHE_REDIS_HOST | REDIS_HOST`
- type: `string`
- default: `'localhost'`

### Port

- object-path: `redis.port`
- dotenv var: `CACHE_REDIS_PORT | REDIS_PORT`
- type: `number`
- default: `6379`

### Database

- object-path: `redis.db`
- dotenv var: `CACHE_REDIS_DATABASE | REDIS_DATABASE`
- type: `number`
- default: `0`

### Key prefix

- object-path: `redis.keyPrefix`
- dotenv var: `CACHE_REDIS_PREFIX`
- type: `string`
- default: `'it24:cache:'`

### Time to live (TTL)

Time to live (expiration time) as `ms-formatted` string (see [ms](https://github.com/vercel/ms) for more information) or number in seconds.

- object-path: `ttl`
- dotenv var: `CACHE_TTL`
- type: `string | number`
- default: `'7d'`

### Survey settings Time to live (TTL)

Survey settings cache Time to live (expiration time) as `ms-formatted` string (see [ms](https://github.com/vercel/ms) for more information) or number in seconds.

- object-path: `surveySettingsTTL`
- dotenv var: `CACHE_SURVEY_SETTINGS_TTL`
- type: `string | number`
- default: `'120s'`
