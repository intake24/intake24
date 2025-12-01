# Pub-Sub Configuration

Path: `apps/api/src/config/pub-sub.ts`

Pub-sub configuration is handled by [Redis](https://redis.io)

## Publisher Redis Configuration

### URL

- object-path: `redis.url`
- dotenv var: `PUBLISHER_REDIS_URL | REDIS_URL`
- type: `string`
- default: `undefined`

### Host

- object-path: `redis.host`
- dotenv var: `PUBLISHER_REDIS_HOST | REDIS_HOST`
- type: `string`
- default: `'localhost'`

### Port

- object-path: `redis.port`
- dotenv var: `PUBLISHER_REDIS_PORT | REDIS_PORT`
- type: `number`
- default: `6379`

### Database

- object-path: `redis.db`
- dotenv var: `PUBLISHER_REDIS_DATABASE | REDIS_DATABASE`
- type: `number`
- default: `0`

## Subscriber Redis Configuration

### URL

- object-path: `redis.url`
- dotenv var: `SUBSCRIBER_REDIS_URL | REDIS_URL`
- type: `string`
- default: `undefined`

### Host

- object-path: `redis.host`
- dotenv var: `SUBSCRIBER_REDIS_HOST | REDIS_HOST`
- type: `string`
- default: `'localhost'`

### Port

- object-path: `redis.port`
- dotenv var: `SUBSCRIBER_REDIS_PORT | REDIS_PORT`
- type: `number`
- default: `6379`

### Database

- object-path: `redis.db`
- dotenv var: `SUBSCRIBER_REDIS_DATABASE | REDIS_DATABASE`
- type: `number`
- default: `0`
