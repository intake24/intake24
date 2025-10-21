import { initContract } from '@ts-rest/core';
import { z } from 'zod';

export const packageImport = initContract().router({
  upload: {
    method: 'POST',
    path: '/admin/package-import/upload',
    body: z.object({}),
    responses: {
      202: z.object({
        importToken: z.string().uuid(),
      }),
    },
    summary: 'Upload package file',
    description: 'Upload and verify an Intake24 food database package file',
  },
  import: {
    method: 'POST',
    path: '/admin/standard-units',
    body: z.object({}),
    responses: {
      202: z.undefined(),
    },
    summary: 'Create standard unit',
    description: 'Create new standard unit',
  },
});
