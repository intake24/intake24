# Performance metrics

Path: `apps/api/src/config/metrics.ts`

Performance metrics are collected in [Prometheus](https://prometheus.io) format.

## Instance ID

Value of the `instance_id` label attached to all collected metrics.

- object-path: `app.instanceId.intake24`
- dotenv var: `METRICS_INSTANCE_ID`
- type: `string`
- default: `'intake24'`

::: tip
If the application is run by [PM2](https://pm2.keymetrics.io), `NODE_APP_INSTANCE` variable set by PM2 is attached as `pm2_instance_id` label.
:::

## Default metrics

Enables / disables collection of default Node.js process metrics.

- object-path: `app.collectDefaultMetrics`
- dotenv var: `METRICS_COLLECT_DEFAULT`
- type: `boolean`
- default: `true`

## Prometheus node exporter

Proxies metrics of locally running [node exporter](https://github.com/prometheus/node_exporter).

### Enabled

- object-path: `prometheusNodeExporter.enabled`
- dotenv var: `METRICS_PROMETHEUS_NODE_EXPORTER_ENABLED`
- type: `boolean`
- default: `false`

### Port

Local port node exporter listens on.

- object-path: `prometheusNodeExporter.port`
- dotenv var: `METRICS_PROMETHEUS_NODE_EXPORTER_PORT`
- type: `number`
- default: `9100`

## Database

### Connection pool stats

- object-path: `app.db.collectConnectionPoolStats`
- dotenv var: `METRICS_COLLECT_DB_CONNECTION_POOL_STATS`
- type: `boolean`
- default: `true`

### Connection duration

- object-path: `app.db.collectConnectionDuration`
- dotenv var: `METRICS_COLLECT_DB_CONNECTION_DURATION`
- type: `boolean`
- default: `true`

## HTTP

### Enabled

- object-path: `app.http.enabled`
- dotenv var: `METRICS_HTTP_ENABLED`
- type: `boolean`
- default: `true`

### Request duration

- object-path: `app.http.collectRequestDuration`
- dotenv var: `METRICS_COLLECT_HTTP_REQUEST_DURATION`
- type: `boolean`
- default: `true`

### Content length

- object-path: `app.http.collectContentLength`
- dotenv var: `METRICS_COLLECT_HTTP_CONTENT_LENGTH`
- type: `boolean`
- default: `true`

## Jobs

### Job duration

- object-path: `app.jobs.enabled`
- dotenv var: `METRICS_COLLECT_JOBS_DURATION`
- type: `boolean`
- default: `true`
