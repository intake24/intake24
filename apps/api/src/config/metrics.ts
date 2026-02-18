import { z } from 'zod';

import { validateConfig } from '@intake24/common-backend';

const metricsConfigSchema = z.object({
  prometheusNodeExporter: z.object({
    enabled: z.boolean().or(z.stringbool()).default(false),
    port: z.coerce.number().default(9100),
  }),
  app: z.object({
    collectDefaultMetrics: z.boolean().or(z.stringbool()).default(true),
    db: z.object({
      collectConnectionPoolStats: z.boolean().or(z.stringbool()).default(true),
      collectConnectionDuration: z.boolean().or(z.stringbool()).default(true),
      collectConnectionSource: z.boolean().or(z.stringbool()).default(true),
    }),
    http: z.object({
      enabled: z.boolean().or(z.stringbool()).default(true),
      collectRequestDuration: z.boolean().or(z.stringbool()).default(true),
      collectContentLength: z.boolean().or(z.stringbool()).default(true),
    }),
    jobs: z.object({
      enabled: z.boolean().or(z.stringbool()).default(true),
    }),
    instanceId: z.object({
      pm2: z.string().optional(),
      intake24: z.string().optional().default('intake24'),
    },
    ),
  }),
});

export type MetricsConfig = z.infer<typeof metricsConfigSchema>;

const parsedMetricsConfig = validateConfig('Performance metrics configuration', metricsConfigSchema, {
  prometheusNodeExporter: {
    enabled: process.env.METRICS_PROMETHEUS_NODE_EXPORTER_ENABLED,
    port: process.env.METRICS_PROMETHEUS_NODE_EXPORTER_PORT,
  },
  app: {
    collectDefaultMetrics: process.env.METRICS_COLLECT_DEFAULT,
    db: {
      collectConnectionPoolStats: process.env.METRICS_COLLECT_DB_CONNECTION_POOL_STATS,
      collectConnectionDuration: process.env.METRICS_COLLECT_DB_CONNECTION_DURATION,
      collectConnectionSource: process.env.METRICS_COLLECT_DB_CONNECTION_SOURCE,
    },
    http: {
      enabled: process.env.METRICS_HTTP_ENABLED,
      collectRequestDuration: process.env.METRICS_COLLECT_HTTP_REQUEST_DURATION,
      collectContentLength: process.env.METRICS_COLLECT_HTTP_CONTENT_LENGTH,
    },
    instanceId: {
      pm2: process.env.NODE_APP_INSTANCE,
      intake24: process.env.METRICS_INSTANCE_ID,
    },
    jobs: {
      enabled: process.env.METRICS_COLLECT_JOBS_DURATION,
    },
  },
});

export default parsedMetricsConfig;
