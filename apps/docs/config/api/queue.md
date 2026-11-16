# Queue

Path: `apps/api/src/config/queue.ts`

Queueing system is handled by [Redis](https://redis.io) & [bullmq](https://github.com/taskforcesh/bullmq).

Connection settings fall back to [common Redis settings](/config/api/#redis) if not set.

## Redis instance

### URL

- object-path: `redis.url`
- dotenv var: `QUEUE_REDIS_URL | REDIS_URL`
- type: `string`
- default: `undefined`

### Host

- object-path: `redis.host`
- dotenv var: `QUEUE_REDIS_HOST | REDIS_HOST`
- type: `string`
- default: `'localhost'`

### Port

- object-path: `redis.port`
- dotenv var: `QUEUE_REDIS_PORT | REDIS_PORT`
- type: `number`
- default: `6379`

### Database

- object-path: `redis.db`
- dotenv var: `QUEUE_REDIS_DATABASE | REDIS_DATABASE`
- type: `number`
- default: `0`

### Key prefix

- object-path: `redis.keyPrefix`
- dotenv var: `QUEUE_REDIS_PREFIX`
- type: `string`
- default: `'it24:queue'`

### Workers

Number of workers to spawn for job queue

- object-path: `workers`
- dotenv var: `QUEUE_WORKERS`
- type: `number`
- default: `3`
