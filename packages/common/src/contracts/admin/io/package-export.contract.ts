import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { packageExportOptions } from '@intake24/common/types/http/admin';

export const packageExport = initContract().router({
  start: {
    method: 'POST',
    path: '/admin/package-export',
    body: packageExportOptions,
    responses: {
      202: z.object({
        jobId: z.string().nonempty(),
      }),
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
    },
    summary: 'Create food database package',
    description: 'Export food data from internal database into a portable food database package format',
  },
});
