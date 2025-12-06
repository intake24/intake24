import { z } from 'zod';

const metricsConfigSchema = z.object({
  prometheusNodeExporter: z.object({
    enabled: z.boolean(),
    port: z.number(),
  }),
  app: z.object({
    collectDefaultMetrics: z.boolean(),
    db: z.object({
      collectConnectionPoolStats: z.boolean(),
      collectConnectionDuration: z.boolean(),
      collectConnectionSource: z.boolean(),
    }),
    http: z.object({
      enabled: z.boolean(),
      collectRequestDuration: z.boolean(),
      collectContentLength: z.boolean(),
    }),
    jobs: z.object({
      enabled: z.boolean(),
    }),
    instanceId: z.object({
      pm2: z.string().optional(),
      intake24: z.string().optional().default('intake24'),
    },
    ),
  }),
});

export type MetricsConfig = z.infer<typeof metricsConfigSchema>;

export default metricsConfigSchema.parse({
  prometheusNodeExporter: {
    enabled: Boolean(process.env.METRICS_PROMETHEUS_NODE_EXPORTER_ENABLED),
    port: Number.parseInt(process.env.METRICS_PROMETHEUS_NODE_EXPORTER_PORT || '9100'),
  },
  app: {
    collectDefaultMetrics: Boolean(process.env.METRICS_COLLECT_DEFAULT),
    db: {
      collectConnectionPoolStats: Boolean(process.env.METRICS_COLLECT_DB_CONNECTION_POOL_STATS),
      collectConnectionDuration: Boolean(process.env.METRICS_COLLECT_DB_CONNECTION_DURATION),
      collectConnectionSource: Boolean(process.env.METRICS_COLLECT_DB_CONNECTION_SOURCE),
    },
    http: {
      enabled: Boolean(process.env.METRICS_HTTP_ENABLED),
      collectRequestDuration: Boolean(process.env.METRICS_COLLECT_HTTP_REQUEST_DURATION),
      collectContentLength: Boolean(process.env.METRICS_COLLECT_HTTP_CONTENT_LENGTH),
    },
    instanceId: {
      pm2: process.env.NODE_APP_INSTANCE,
      intake24: process.env.METRICS_INSTANCE_ID,
    },
    jobs: {
      enabled: Boolean(process.env.METRICS_COLLECT_JOBS_DURATION),
    },
  },
});
