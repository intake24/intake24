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
});
