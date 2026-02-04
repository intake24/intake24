import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { packageExportOptions, packageImportRequest, packageVerificationRequest } from '@intake24/common/types/http/admin';

export const packages = initContract().router({
  queueExport: {
    method: 'POST',
    path: '/admin/packages/export',
    body: packageExportOptions,
    responses: {
      202: z.object({
        jobId: z.string().nonempty(),
      }),
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
    },
    summary: 'Queue food database package export',
    description: 'Queue a job to export food data from internal database into a portable food database package format',
  },
  queueVerification: {
    method: 'POST',
    path: '/admin/packages/verify',
    body: packageVerificationRequest,
    responses: {
      202: z.object({
        jobId: z.string().nonempty(),
      }),
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
    },
    summary: 'Queue package verification',
    description: 'Queue a job to verify and validate an uploaded food database package file',
  },
  queueImport: {
    method: 'POST',
    path: '/admin/packages/import',
    body: packageImportRequest,
    responses: {
      202: z.object({
        jobId: z.string().nonempty(),
      }),
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
    },
    summary: 'Queue food database package import',
    description: 'Queue a job to import food data from a verified package into the internal database',
  },
});
