import { createReadStream } from 'node:fs';

import { initServer } from '@ts-rest/express';

import contract from '@intake24/common/contracts';

import { permission } from '../../middleware/acl';

// Clustered/load-balanced mode notes:
//
// The current implementation returns metrics from a single worker process.
//
// Under PM2 or similar round-robin style load balancing, metrics requests will
// alternate between worker processes, collecting data from all running instances
// albeit at a lower (1/N) rate in an ideal scenario.
//
// This assumption doesn't hold in the general case: load balancers don't necessarily
// use round-robin, and even if that is the case, optimisations like sticky
// sessions or HTTP keep-alive can interfere with the even distribution of requests.
//
// There are several ways to ensure metrics data is always collected from all running
// instances:
//
// 1. Run a separate aggregator process that queries every instance bypassing the
//    load balancer. This is not always practical, for example, in PM2 cluster
//    mode workers bind to the same port (via SO_REUSEPORT or a reverse proxy)
//    and there is no way to connect to a specific process.
//
// 2. Use a service VPN like WireGuard for direct communication between instances.
//    (in case of load balancing between multiple nodes, for a single local PM2 cluster
//     can just bind to localhost).
//
// 3. Use Redis pub/sub channels instead of direct communication.
//
// Option 3 is likely the easiest to implement without expanding the current infrastructure,
// but is still not trivial.
//
// prometheus-node-exporter forwarding:
//
// Prometheus metrics format is very inefficient (~150 KB per request in default configuration),
// and gzip should be used to keep it reasonable, and the /metrics/node implementation should
// ideally directly stream gzipped response from prometheus-node-exporter.
//
// Not sure if it is possible/practical within the ts-rest router infrastructure, so maybe this
// should be refactored without ts-rest

export function metrics() {
  return initServer().router(contract.admin.metrics, {
    appMetrics: {
      middleware: [permission('metrics:app')],
      handler: async ({ req }) => {
        const metrics = await req.scope.cradle.appMetricsService.getMetrics();
        return { status: 200, headers: { 'Content-Type': 'text/plain; version=0.0.4;' }, body: metrics };
      },
    },
    nodeMetrics: {
      middleware: [permission('metrics:node')],
      handler: async ({ req }) => {
        const { metricsConfig } = req.scope.cradle;
        if (!metricsConfig.prometheusNodeExporter.enabled)
          return { status: 503, body: undefined };

        try {
          const nodeExporterUrl = `http://127.0.0.1:${metricsConfig.prometheusNodeExporter.port}/metrics`;
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
    writeHeapSnapshot: {
      middleware: [permission('metrics:heap-snapshots')],
      handler: async ({ req }) => {
        const filename = await req.scope.cradle.appMetricsService.writeHeapSnapshot();
        return { status: 200, body: { filename } };
      },
    },
    getHeapSnapshot: {
      middleware: [permission('metrics:heap-snapshots')],
      handler: async ({ req, res, params: { heapSnapshot } }) => {
        const { filename, filePath, size } = await req.scope.cradle.appMetricsService.getHeapSnapshot(heapSnapshot);

        res.set('Content-Disposition', `attachment; filename=${filename}`);
        res.set('Content-Length', size.toString());

        return {
          status: 200,
          contentType: 'application/octet-stream',
          body: createReadStream(filePath),
        };
      },
    },
  });
}
