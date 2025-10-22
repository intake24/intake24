import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export const packageImport = initContract().router({
  upload: {
    method: 'POST',
    path: '/admin/package-import/upload',
    body: z.any(),
    responses: {
      201: z.object({
        message: z.string(),
        path: z.string().optional(),
      }),
      400: z.object({ error: z.string() }),
      401: z.object({ error: z.string() }),
    },
    summary: 'Upload package file',
    description: 'Upload and verify an Intake24 food database package file',
  },
});
