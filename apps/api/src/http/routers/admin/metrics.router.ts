import { initServer } from '@ts-rest/express';
import ioc from '@intake24/api/ioc';
import contract from '@intake24/common/contracts';
import { permission } from '../../middleware/acl';

export function metrics() {
  const metricsConfig = ioc.cradle.metricsConfig;
  const appMetricsService = ioc.cradle.appMetricsService;
  const nodeExporterUrl = `http://127.0.0.1:${metricsConfig.prometheusNodeExporter.port}/metrics`;

  return initServer().router(contract.admin.metrics, {
    appMetrics: {
      middleware: [permission('metrics-app')],
      handler: async () => {
        const metrics = await appMetricsService.registry.metrics();
        return { status: 200, headers: { 'Content-Type': 'text/plain; version=0.0.4;' }, body: metrics };
      },
    },
    nodeMetrics: {
      middleware: [permission('metrics-node')],
      handler: async () => {
        if (!metricsConfig.prometheusNodeExporter.enabled)
          return { status: 503, body: undefined };

        try {
          const nodeExporterResponse = await fetch(nodeExporterUrl, { method: 'GET' });

          if (!nodeExporterResponse.ok) {
            return { status: 503, body: undefined };
          }

          // This is stupid and the response should be streamed, but couldn't figure out how to do that so it plays
          // nice with ts-rest :\
          const body = await nodeExporterResponse.text();

          return {
            status: 200,
            body,
          };
        }
        catch {
          return { status: 503, body: undefined };
        }
      },
    },
  });
}
