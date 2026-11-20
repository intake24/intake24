# Rate limiter

Path: `apps/api/src/config/rate-limiter.ts`

[Redis](https://redis.io) is used as rate-limiter store driver.

Connection settings fall back to [common Redis settings](/config/api/#redis) if not set.

:::tip Rate limiter time window definition
Time window to track the requests is defined as `ms-formatted` string, see [ms](https://github.com/vercel/ms) for more information.
:::

## Redis instance

### URL

- object-path: `redis.url`
- dotenv var: `RATE_LIMITER_REDIS_URL | REDIS_URL`
- type: `string`
- default: `undefined`

### Host

- object-path: `redis.host`
- dotenv var: `RATE_LIMITER_REDIS_HOST | REDIS_HOST`
- type: `string`
- default: `'localhost'`

### Port

- object-path: `redis.port`
- dotenv var: `RATE_LIMITER_REDIS_PORT | REDIS_PORT`
- type: `number`
- default: `6379`

### Database

- object-path: `redis.db`
- dotenv var: `RATE_LIMITER_REDIS_DATABASE | REDIS_DATABASE`
- type: `number`
- default: `0`

### Key prefix

- object-path: `redis.keyPrefix`
- dotenv var: `RATE_LIMITER_REDIS_PREFIX`
- type: `string`
- default: `'it24:rate-limiter:'`

## Generic

Generic rate limit settings for `/api` routes.

### Window

Time window to track the requests.

- object-path: `generic.windowMs`
- dotenv var: `RATE_LIMITER_GENERIC_WINDOW`
- type: `string`
- default: `'5m'`

### Limit

Maximum number of requests that can be made within the specified time window.

- object-path: `generic.limit`
- dotenv var: `RATE_LIMITER_GENERIC_LIMIT`
- type: `number`
- default: `300`

## Login

Rate limit settings for `/api/auth/login | /api/auth/login/alias | /api/auth/login/token` routes.

### Window

Time window to track the requests.

- object-path: `login.windowMs`
- dotenv var: `RATE_LIMITER_LOGIN_WINDOW`
- type: `string`
- default: `'15m'`

### Limit

Maximum number of requests that can be made within the specified time window.

- object-path: `login.limit`
- dotenv var: `RATE_LIMITER_LOGIN_LIMIT`
- type: `number`
- default: `5`

## Password

Rate limit settings for `/api/password` routes.

### Window

Time window to track the requests.

- object-path: `password.windowMs`
- dotenv var: `RATE_LIMITER_PASSWORD_WINDOW`
- type: `string`
- default: `'5m'`

### Limit

Maximum number of requests that can be made within the specified time window.

- object-path: `password.limit`
- dotenv var: `RATE_LIMITER_PASSWORD_LIMIT`
- type: `number`
- default: `1`

## Verify

Rate limit settings for `/api/admin/user/verify` route (sending email verification).

### Window

Time window to track the requests.

- object-path: `verify.windowMs`
- dotenv var: `RATE_LIMITER_VERIFY_WINDOW`
- type: `string`
- default: `'5m'`

### Limit

Maximum number of requests that can be made within the specified time window.

- object-path: `verify.limit`
- dotenv var: `RATE_LIMITER_VERIFY_LIMIT`
- type: `number`
- default: `1`

## Generate user

Rate limit settings for `/api/surveys/:surveyId/generate-user` routes.

### Window

Time window to track the requests.

- object-path: `generateUser.windowMs`
- dotenv var: `RATE_LIMITER_GEN_USER_WINDOW`
- type: `string`
- default: `'5m'`

### Limit

Maximum number of requests that can be made within the specified time window.

- object-path: `generateUser.limit`
- dotenv var: `RATE_LIMITER_GEN_USER_LIMIT`
- type: `number`
- default: `1`

## PDF outputs

Rate limit settings for `/api/user/feedback` - `download` and `email` routes.

### Window

Time window to track the requests.

- object-path: `feedback.windowMs`
- dotenv var: `RATE_LIMITER_FEEDBACK_WINDOW`
- type: `string`
- default: `'1m'`

### Limit

Maximum number of requests that can be made within the specified time window.

- object-path: `feedback.limit`
- dotenv var: `RATE_LIMITER_FEEDBACK_LIMIT`
- type: `number`
- default: `1`

## Survey / feedback ratings

Rate limit settings for `/api/surveys/:surveyId/rating`.

### Window

Time window to track the requests.

- object-path: `rating.windowMs`
- dotenv var: `RATE_LIMITER_RATING_WINDOW`
- type: `string`
- default: `'15m'`

### Limit

Maximum number of requests that can be made within the specified time window.

- object-path: `rating.limit`
- dotenv var: `RATE_LIMITER_RATING_LIMIT`
- type: `number`
- default: `1`
