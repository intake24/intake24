import { Readable } from 'node:stream';
import { initContract } from '@ts-rest/core';
import z from 'zod';

const contract = initContract();

export const metrics = contract.router({
  appMetrics: {
    method: 'GET',
    path: '/admin/metrics/app',
    responses: {
      200: contract.otherResponse({ contentType: 'text/plain; version=0.0.4; charset=utf-8', body: z.string() }),
    },
    summary: 'Get metrics (app)',
    description: 'Returns internal app metrics for scraping by Prometheus',
  },
  nodeMetrics: {
    method: 'GET',
    path: '/admin/metrics/node',
    responses: {
      200: contract.otherResponse({ contentType: 'text/plain; version=0.0.4; charset=utf-8', body: z.string().optional() }),
    },
    summary: 'Get metrics (node)',
    description: 'Returns prometheus-node-exporter metrics for the underlying machine',
  },
  writeHeapSnapshot: {
    method: 'POST',
    path: '/admin/metrics/heap-snapshots',
    body: null,
    responses: {
      200: z.object({ filename: z.string() }),
    },
    summary: 'Generate heap snapshot',
    description: 'Generates a heap snapshot',
  },
  getHeapSnapshot: {
    method: 'GET',
    path: '/admin/metrics/heap-snapshots/:heapSnapshot',
    responses: {
      200: z.instanceof(Readable),
    },
    summary: 'Download heap snapshot',
    description: 'Downloads heap snapshot file',
  },
});
