import { Readable } from 'node:stream';

import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { bigIntString as jobId, paginationMeta, paginationRequest } from '@intake24/common/types/http';
import { jobAttributes, repeatJobRequest } from '@intake24/common/types/http/admin';

const contract = initContract();

export const job = contract.router({
  browse: {
    method: 'GET',
    path: '/admin/jobs',
    query: paginationRequest,
    responses: {
      200: z.object({
        data: jobAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse jobs',
    description: 'Browse jobs (paginated list)',
  },
  read: {
    method: 'GET',
    path: '/admin/jobs/:jobId',
    pathParams: z.object({ jobId }),
    responses: {
      200: jobAttributes,
    },
    summary: 'Get job',
    description: 'Get job by id',
  },
  destroy: {
    method: 'DELETE',
    path: '/admin/jobs/:jobId',
    pathParams: z.object({ jobId }),
    body: null,
    responses: {
      204: contract.noBody(),
    },
    summary: 'Delete job',
    description: 'Delete job by id',
  },
  download: {
    method: 'GET',
    path: '/admin/jobs/:jobId/download',
    pathParams: z.object({ jobId }),
    responses: {
      200: z.instanceof(Readable),
    },
    summary: 'Download job attachment',
    description: 'Download job attachment by id (if any and not expired)',
  },
  repeat: {
    method: 'POST',
    path: '/admin/jobs/:jobId/repeat',
    pathParams: z.object({ jobId }),
    body: repeatJobRequest.optional(),
    responses: {
      200: jobAttributes,
    },
    summary: 'Repeat job',
    description: 'Repeat job by id with same parameters',
  },
});
