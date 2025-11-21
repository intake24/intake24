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
    }),
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
    },
  },
});
