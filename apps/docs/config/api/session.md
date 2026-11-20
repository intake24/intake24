# Session

Path: `apps/api/src/config/session.ts`

[Redis](https://redis.io) is used as session store driver.

Connection settings fall back to [common Redis settings](/config/api/#redis) if not set.

## Redis instance

### URL

- object-path: `redis.url`
- dotenv var: `SESSION_REDIS_URL | REDIS_URL`
- type: `string`
- default: `undefined`

### Host

- object-path: `redis.host`
- dotenv var: `SESSION_REDIS_HOST | REDIS_HOST`
- type: `string`
- default: `'localhost'`

### Port

- object-path: `redis.port`
- dotenv var: `SESSION_REDIS_PORT | REDIS_PORT`
- type: `number`
- default: `6379`

### Database

- object-path: `redis.db`
- dotenv var: `SESSION_REDIS_DATABASE | REDIS_DATABASE`
- type: `number`
- default: `0`

### Key prefix

- object-path: `redis.keyPrefix`
- dotenv var: `SESSION_REDIS_PREFIX`
- type: `string`
- default: `'it24:session:'`

## Cookie

### Cookie name

- object-path: `cookie.name`
- dotenv var: `SESSION_COOKIE_NAME`
- type: `string`
- default: `it24_session`

### Cookie maxAge

Lifetime of cookie. Defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.

- object-path: `cookie.maxAge`
- dotenv var: `SESSION_COOKIE_LIFETIME`
- default: `'15m'`
- type: `string`

### Cookie httpOnly

- object-path: `cookie.httpOnly`
- type: `boolean`
- default: `true`

### Cookie path

- object-path: `cookie.path`
- dotenv var: `SESSION_COOKIE_PATH`
- type: `string`
- default: `'/api/admin'`

### Cookie sameSite

- object-path: `cookie.sameSite`
- dotenv var: `SESSION_COOKIE_SAME_SITE`
- type: `'lax' | 'strict' | 'none'`
- default: `'lax'`

### Cookie secure

- object-path: `cookie.secure`
- dotenv var: `SESSION_COOKIE_SECURE`
- type: `boolean`
- default: `false`
