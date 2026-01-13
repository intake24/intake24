import { Readable } from 'node:stream';

import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { jobTypes } from '@intake24/common/types';
import { paginationMeta, paginationRequest } from '@intake24/common/types/http';
import { jobAttributes, userJobRequest } from '@intake24/common/types/http/admin';

export const job = initContract().router({
  browse: {
    method: 'GET',
    path: '/admin/user/jobs',
    query: paginationRequest.extend({
      type: z.union([z.enum(jobTypes), z.enum(jobTypes).array()]).optional(),
      localeId: z.string().optional(),
      nutrientTableId: z.string().optional(),
      surveyId: z.string().optional(),
      startedAfter: z.string().datetime().optional(),
    }),
    responses: {
      200: z.object({
        data: jobAttributes.array(),
        meta: paginationMeta,
      }),
    },
    summary: 'Browse user jobs',
    description: 'Browse user jobs (paginated list)',
  },
  submit: {
    method: 'POST',
    path: '/admin/user/jobs',
    body: userJobRequest,
    responses: {
      200: jobAttributes,
    },
    summary: 'Submit job',
    description: 'Submit new job to the queue',
  },
  read: {
    method: 'GET',
    path: '/admin/user/jobs/:jobId',
    responses: {
      200: jobAttributes,
    },
    summary: 'Get user job',
    description: 'Get user job by id',
  },
  download: {
    method: 'GET',
    path: '/admin/user/jobs/:jobId/download',
    responses: {
      200: z.instanceof(Readable),
    },
    summary: 'Download user job attachment',
    description: 'Download user job attachment by id (if any and not expired)',
  },
});
